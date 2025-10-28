
import { getCommunityExportData } from '@/app/actions';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { communityId } = await req.json();

        if (!communityId) {
            return new Response(JSON.stringify({ error: 'Community ID is required' }), { status: 400 });
        }
        
        const stream = new ReadableStream({
            async start(controller) {
                const onStep = (step: 'community' | 'members' | 'messages') => {
                    controller.enqueue(`data: ${JSON.stringify({ step })}\n\n`);
                };

                try {
                    const result = await getCommunityExportData(communityId, onStep);
                    if (result.success) {
                       const data = JSON.parse(result.exportData);
                       controller.enqueue(`data: ${JSON.stringify({ data })}\n\n`);
                    } else {
                        controller.enqueue(`data: ${JSON.stringify({ error: result.message, details: JSON.parse(result.exportData) })}\n\n`);
                    }
                } catch (e: any) {
                     controller.enqueue(`data: ${JSON.stringify({ error: e.message || 'An internal error occurred.' })}\n\n`);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'An internal error occurred.' }), { status: 500 });
    }
}
