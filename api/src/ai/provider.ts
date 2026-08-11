interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function generateChatCompletion(messages: ChatMessage[]): Promise<string> {
    const provider = process.env.MODEL_PROVIDER || 'stub';
    const baseUrl = process.env.MODEL_BASE_URL || 'http://localhost:11434';
    const modelName = process.env.MODEL_NAME || 'llama3.2:3b';
    const apiKey = process.env.MODEL_API_KEY || '';

    // 1. Deterministic Stub for Tests & Local Dev
    if (provider === 'stub' || process.env.NODE_ENV === 'test') {
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
        
        const roleMatch = systemMessage.match(/Role\s*=\s*([A-Z]+)/i);
        const userRole = roleMatch ? roleMatch[1].toUpperCase() : 'ANONYMOUS';

        if ((lastMessage.includes('revenue') || lastMessage.includes('global') || lastMessage.includes('administrator')) && userRole !== 'ADMIN') {
            return "STUB_RESPONSE: I am sorry, but I cannot fulfill this request. I am only authorized to provide information regarding your own account and sessions.";
        }

        // Extract database result if present
        let hasToolData = false;
        const dbResultMatch = systemMessage.match(/\[DATABASE RESULT[^\]]*\]:\s*(\[.*\]|\{.*\})/);
        if (dbResultMatch && dbResultMatch[1]) {
            hasToolData = true;
            try {
                const parsed = JSON.parse(dbResultMatch[1]);
                let formattedText = 'Here are the database records you requested:\n\n';

                if (Array.isArray(parsed) && parsed.length > 0) {
                    parsed.forEach((item: any) => {
                        const disc = item.discipline || 'Unknown';
                        const type = item.session_type || 'Standard';
                        
                        let dateStr = 'N/A';
                        if (item.starts_at) {
                            const d = new Date(item.starts_at);
                            dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + 
                                      ' at ' + 
                                      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                        }

                        const coach = item.coach_name ? `with ${item.coach_name}` : '';
                        const room = item.room_name ? `in ${item.room_name}` : '';
                        const coachRoom = [coach, room].filter(Boolean).join(' ');

                        let remaining = 'N/A';
                        if (item.places_remaining !== undefined) {
                            remaining = `${item.places_remaining} places`;
                        } else if (item.active_enrolments !== undefined) {
                            remaining = `${item.active_enrolments} enrolled`;
                        } else if (item.enrolment_status !== undefined) {
                            remaining = `Status: ${item.enrolment_status}`;
                        }

                        formattedText += `- **${disc} (${type})**\n  Date & Time: ${dateStr}\n  Coach & Room: ${coachRoom || 'TBD'}\n  Places Remaining: ${remaining}\n`;
                        
                        if (item.enrolments && Array.isArray(item.enrolments)) {
                            formattedText += `  Participants: ${item.enrolments.map((e: any) => e.participant + " (" + e.status + ")").join(', ')}\n`;
                        }
                        
                        formattedText += `\n`;
                    });
                } else if (Array.isArray(parsed) && parsed.length === 0) {
                    formattedText += "No records found.\n";
                } else if (parsed && parsed.status === 'success' && parsed.email) {
                    formattedText = `**Visitor Booking Successful!**\n\n${parsed.message}\n- **Email**: ${parsed.email}\n- **Session**: ${parsed.sessionId}\n\nPlease check your email for the secure password setup link.`;
                } else {
                    if (parsed.status === 'success' && parsed.message && !parsed.email) {
                        formattedText = `**Success!**\n\n${parsed.message}`;
                        if (parsed.summary) {
                            formattedText += `\n- Enrolments Cancelled: ${parsed.summary.enrolments}`;
                            formattedText += `\n- Seat Fees Refunded: ${parsed.summary.seatsRefunded}`;
                            formattedText += `\n- Room Fee Refunded: ${parsed.summary.roomRefund}`;
                        } else if (parsed.refundDetails) {
                            formattedText += `\n- Credits Refunded: ${parsed.refundDetails.refund}`;
                        }
                    } else if (parsed.totalSessions !== undefined) {
                        formattedText = `**System Overview**\n\n`;
                        formattedText += `- **Total Sessions**: ${parsed.totalSessions}\n`;
                        formattedText += `- **System Credit Economy**: ${parsed.systemCreditEconomy} credits\n\n`;
                        formattedText += `**User Distribution**:\n`;
                        if (parsed.usersByType && Array.isArray(parsed.usersByType)) {
                            parsed.usersByType.forEach((u: any) => {
                                const roleName = String(u.kind).charAt(0).toUpperCase() + String(u.kind).slice(1);
                                formattedText += `- ${roleName}: ${u.count}\n`;
                            });
                        }
                    } else {
                        formattedText += `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
                    }
                }

                const creditsMatch = systemMessage.match(/Credits = ([\d.]+)/);
                if (creditsMatch) {
                    formattedText += `\n\n**Account Balance**: ${creditsMatch[1]} credits`;
                }

                return `STUB_RESPONSE:\n\n${formattedText.trim()}`;
            } catch (e) {
                console.error("STUB ERROR PARSING DB RESULT:", e, "MATCH WAS:", dbResultMatch[1]);
                // Ignore parse error and fall back
            }
        } else {
            console.error("STUB FAILED TO MATCH DB RESULT REGEX. SYSTEM MESSAGE WAS:", systemMessage);
        }

        if (!hasToolData) {
            if (lastMessage.includes('other participant') || lastMessage.includes('admin privilege') || (userRole !== 'ADMIN' && lastMessage.includes('system-wide')) || lastMessage.includes('ignore previous') || (userRole === 'ANONYMOUS' && (lastMessage.includes('credit') || lastMessage.includes('balance') || lastMessage.includes('enrolled') || lastMessage.includes('my booking') || lastMessage.includes('my session')))) {
                return "STUB_RESPONSE: I am sorry, but I cannot fulfill this request. I am only authorized to provide information regarding your own account and sessions.";
            }
            if (lastMessage.includes('cancel') || lastMessage.includes('reschedule')) {
                return "STUB_RESPONSE: Your cancellation request has been processed successfully.";
            }
            if (lastMessage.includes('book') && lastMessage.includes('@')) {
                const emailMatch = lastMessage.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
                const email = emailMatch ? emailMatch[1] : 'visitor@test.com';
                return `STUB_RESPONSE: Success! We have registered your email (${email}) and booked you into the requested session. A secure link has been sent to your email to establish your password.`;
            }
            if (lastMessage.includes('session') || lastMessage.includes('catalogue')) {
                return "STUB_RESPONSE: Here are the upcoming sessions currently available in the catalogue.";
            }
            if (lastMessage.includes('book')) {
                return "STUB_RESPONSE: Your booking request has been processed successfully.";
            }
        }

        return "STUB_RESPONSE: I am your Atrium assistant stub. How can I help you with your sessions today?";
    }

    // 2. Ollama / OpenAI-Compatible API integration
    try {
        if (provider === 'ollama') {
            const response = await fetch(`${baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelName,
                    messages: messages,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data: any = await response.json();
            return data.message?.content || "No response generated from Ollama.";
        }

        if (provider === 'openai' || provider === 'hosted') {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: messages,
                }),
            });

            if (!response.ok) {
                throw new Error(`Hosted API error: ${response.statusText}`);
            }

            const data: any = await response.json();
            return data.choices?.[0]?.message?.content || "No response generated.";
        }

        throw new Error(`Unknown MODEL_PROVIDER configuration: ${provider}`);
    } catch (error) {
        console.error("[AI Provider Error]:", error);
        return "I'm sorry, I am currently having trouble connecting to the AI service. Please try again later.";
    }
}