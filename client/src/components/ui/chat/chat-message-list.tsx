import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import debounce from "lodash.debounce";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ children, className = "", ...props }, _ref) => {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Scroll to bottom handler
    const scrollToBottom = useCallback(() => {
      const container = scrollRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }, []);

    // Check scroll position (debounced)
    const checkScrollPosition = useCallback(
      debounce(() => {
        const container = scrollRef.current;
        if (!container) return;

        const threshold = 100; // pixels from bottom to still be considered "at bottom"
        const isAtBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight <
          threshold;

        setShowScrollButton(!isAtBottom);
      }, 100),
      []
    );

    // Attach scroll listener
    useEffect(() => {
      const container = scrollRef.current;
      if (!container) return;

      container.addEventListener("scroll", checkScrollPosition);
      return () => {
        container.removeEventListener("scroll", checkScrollPosition);
      };
    }, [checkScrollPosition]);

    // Auto-scroll to bottom on mount or new children
    useEffect(() => {
      scrollToBottom();
    }, [children, scrollToBottom]);

    return (
      <div className="relative w-full">
        <div
          ref={scrollRef}
          className={`flex flex-col w-full h-[70vh] p-4 overflow-y-auto ${className}`}
          {...props}
        >
          <div className="flex flex-col gap-6">{children}</div>
        </div>

        {showScrollButton && (
          <Button
            onClick={scrollToBottom}
            size="icon"
            variant="outline"
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 shadow-md rounded-full bg-background"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList };
