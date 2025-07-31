import React from 'react'

const Chat = () => {
  return (
    <div>Chat</div>
  )
}

export default Chat

// // "use client";

// // import {
// //   ChatBubble,
// //   ChatBubbleAction,
// //   ChatBubbleActionWrapper,
// //   ChatBubbleAvatar,
// //   ChatBubbleMessage,
// //   ChatBubbleTimestamp,
// // } from "@/components/ui/chat/chat-bubble";
// // import { ChatInput } from "@/components/ui/chat/chat-input";
// // import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
// // import { Button } from "@/components/ui/button";
// // import {
// //   CopyIcon,
// //   CornerDownLeft,
// //   Mic,
// //   Paperclip,
// //   RefreshCcw,
// //   Volume2,
// // } from "lucide-react";
// // import { useChat } from "@ai-sdk/react";
// // import { useEffect, useRef, useState } from "react";
// // import Markdown from "react-markdown";
// // import remarkGfm from "remark-gfm";
// // import CodeDisplayBlock from "@/components/code-display-block";

// // const ChatAiIcons = [
// //   { icon: CopyIcon, label: "Copy" },
// //   { icon: RefreshCcw, label: "Refresh" },
// //   { icon: Volume2, label: "Volume" },
// // ];

// // export default function Home() {
// //   const [isGenerating, setIsGenerating] = useState(false);

// //   const {
// //     messages,
// //     setMessages,
// //     input,
// //     handleInputChange,
// //     handleSubmit,
// //     isLoading,
// //     reload,
// //   } = useChat({
// //     onResponse: () => setIsGenerating(false),
// //     onError: () => setIsGenerating(false),
// //   });

// //   const messagesRef = useRef<HTMLDivElement>(null);
// //   const formRef = useRef<HTMLFormElement>(null);

// //   useEffect(() => {
// //     if (messagesRef.current) {
// //       messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
// //     }
// //   }, [messages]);

// //   const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
// //     e.preventDefault();
// //     if (!input || isLoading) return;
// //     setIsGenerating(true);
// //     handleSubmit(e);
// //   };

// //   const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
// //     if (e.key === "Enter" && !e.shiftKey) {
// //       e.preventDefault();
// //       onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
// //     }
// //   };

// //   const handleActionClick = async (action: string, index: number) => {
// //     const message = messages[index];
// //     if (!message || message.role !== "assistant") return;

// //     if (action === "Copy") {
// //       navigator.clipboard.writeText(message.content);
// //     } else if (action === "Refresh") {
// //       setIsGenerating(true);
// //       try {
// //         await reload();
// //       } catch (err) {
// //         console.error("Reload failed:", err);
// //       } finally {
// //         setIsGenerating(false);
// //       }
// //     } else if (action === "Volume") {
// //       const utterance = new SpeechSynthesisUtterance(message.content);
// //       speechSynthesis.speak(utterance);
// //     }
// //   };

// //   return (
// //     <main className="flex h-screen w-full max-w-3xl flex-col items-center mx-auto">
// //       {/* Chat List */}
// //       <div
// //         ref={messagesRef}
// //         className="flex-1 w-full overflow-y-auto py-6 px-4"
// //       >
// //         <ChatMessageList>
// //           {messages.map((message, index) => {
// //             const isAssistant = message.role === "assistant";
// //             const isLastAssistant = isAssistant && index === messages.length - 1;

// //             return (
// //               <ChatBubble
// //                 key={index}
// //                 variant={isAssistant ? "received" : "sent"}
// //               >
// //                 <ChatBubbleAvatar
// //                   fallback={isAssistant ? "🤖" : "👨🏽"}
// //                 />
// //                 <div className="flex flex-col gap-0.5">
// //                   <ChatBubbleMessage
// //                     variant={isAssistant ? "received" : "sent"}
// //                   >
// //                     {message.content.split("```").map((part, i) =>
// //                       i % 2 === 0 ? (
// //                         <Markdown key={i} remarkPlugins={[remarkGfm]}>
// //                           {part}
// //                         </Markdown>
// //                       ) : (
// //                         <pre className="whitespace-pre-wrap pt-2" key={i}>
// //                           <CodeDisplayBlock code={part} lang="" />
// //                         </pre>
// //                       )
// //                     )}
// //                   </ChatBubbleMessage>
// //                   <ChatBubbleTimestamp
// //                     timestamp={new Date().toLocaleTimeString([], {
// //                       hour: "2-digit",
// //                       minute: "2-digit",
// //                     })}
// //                   />
// //                 </div>

// //                 {isLastAssistant && (
// //                   <ChatBubbleActionWrapper variant="received">
// //                     {!isGenerating &&
// //                       ChatAiIcons.map((icon, iconIndex) => {
// //                         const Icon = icon.icon;
// //                         return (
// //                           <ChatBubbleAction
// //                             key={iconIndex}
// //                             icon={<Icon className="size-3" />}
// //                             onClick={() =>
// //                               handleActionClick(icon.label, index)
// //                             }
// //                           />
// //                         );
// //                       })}
// //                   </ChatBubbleActionWrapper>
// //                 )}
// //               </ChatBubble>
// //             );
// //           })}

// //           {/* Loading Indicator */}
// //           {isGenerating && (
// //             <ChatBubble variant="received">
// //               <ChatBubbleAvatar fallback="🤖" />
// //               <ChatBubbleMessage isLoading />
// //             </ChatBubble>
// //           )}
// //         </ChatMessageList>
// //       </div>

// //       {/* Chat Input Form */}
// //       <div className="w-full px-4 pb-4">
// //         <form
// //           ref={formRef}
// //           onSubmit={onSubmit}
// //           className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
// //         >
// //           <ChatInput
// //             value={input}
// //             onKeyDown={onKeyDown}
// //             onChange={handleInputChange}
// //             placeholder="Type your message here..."
// //             className="rounded-lg bg-background border-0 shadow-none focus-visible:ring-0"
// //           />
// //           <div className="flex items-center p-3 pt-0">
// //             <Button variant="ghost" size="icon">
// //               <Paperclip className="size-4" />
// //               <span className="sr-only">Attach file</span>
// //             </Button>

// //             <Button variant="ghost" size="icon">
// //               <Mic className="size-4" />
// //               <span className="sr-only">Use Microphone</span>
// //             </Button>

// //             <Button
// //               disabled={!input || isLoading}
// //               type="submit"
// //               size="sm"
// //               className="ml-auto gap-1.5"
// //             >
// //               Send Message
// //               <CornerDownLeft className="size-3.5" />
// //             </Button>
// //           </div>
// //         </form>
// //       </div>
// //     </main>
// //   );
// // }
