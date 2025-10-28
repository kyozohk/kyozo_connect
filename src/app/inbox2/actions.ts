
'use server';

import { getDb } from '@/lib/mongodb';
import { Community, Member } from '@/types';
import { ObjectId } from 'mongodb';

export interface CommunityWithMembers extends Community {
  members: Member[];
}

export async function getCommunitiesWithMembers(): Promise<CommunityWithMembers[]> {
  try {
    const db = await getDb();
    const communitiesWithMembers = await db.collection('communities').aggregate([
      // Stage 1: Initial filter if needed (e.g., filter by status)
      { $match: { status: 'publish' } },
      
      // Stage 2: Unwind the usersList array to process each member
      { $unwind: { path: '$usersList', preserveNullAndEmptyArrays: true } },
      
      // Stage 3: Lookup user details from the 'users' collection
      {
        $lookup: {
          from: 'users',
          localField: 'usersList.userId',
          foreignField: '_id',
          as: 'memberInfo'
        }
      },
      
      // Stage 4: Unwind the memberInfo array
      { $unwind: { path: '$memberInfo', preserveNullAndEmptyArrays: true } },

      // Stage 5: Determine the role for each member
      {
        $addFields: {
          'memberRole': {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$memberInfo._id', '$owner'] },
                  then: 'owner'
                },
                {
                  case: { 
                    $in: ['$memberInfo._id', {
                      $map: {
                        input: {
                          $filter: {
                            input: '$communityHandles',
                            as: 'handle',
                            cond: { $in: ['$$handle.role', ['cl', 'admin']] }
                          }
                        },
                        as: 'handle',
                        in: '$$handle.userId'
                      }
                    }]
                  },
                  then: 'admin'
                }
              ],
              default: 'member'
            }
          }
        }
      },

      // Stage 6: Group back by community, collecting all members
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          communityProfileImage: { $first: '$communityProfileImage' },
          rawCommunity: { $first: '$$ROOT' },
          members: {
            $push: {
              // only push if memberInfo exists
              $cond: [ 
                '$memberInfo._id',
                {
                  id: { $toString: '$memberInfo._id' },
                  uid: '$memberInfo.firebaseUid',
                  displayName: { $ifNull: ['$memberInfo.displayName', '$memberInfo.fullName'] },
                  photoURL: { $ifNull: ['$memberInfo.photoURL', '$memberInfo.profileImage'] },
                  email: '$memberInfo.email',
                  phoneNumber: '$memberInfo.phoneNumber',
                  joinedAt: { $ifNull: [ '$usersList.joinedAt', '$$NOW' ]},
                  role: '$memberRole',
                  data: '$memberInfo',
                },
                '$$REMOVE' // Remove the item from the members array if memberInfo._id doesn't exist
              ]
            }
          }
        }
      },

      // Stage 7: Final projection to shape the output
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          name: '$name',
          communityProfileImage: '$communityProfileImage',
          memberCount: { $size: '$members' },
          data: {
             // Re-add fields from the original community that were lost in $group
            ...Object.fromEntries(
                Object.keys(db.collection('communities').findOne({}) || {}).map(k => [k, `$rawCommunity.${k}`])
            ),
             // Remove fields we don't need in the final `data` blob
            usersList: 0, 
          },
          members: '$members',
        }
      },
      { $sort: { name: 1 } }
    ]).toArray();
    
    // Convert date objects to ISO strings
    return JSON.parse(JSON.stringify(communitiesWithMembers));

  } catch (error) {
    console.error('Failed to get communities with members:', error);
    return [];
  }
}
