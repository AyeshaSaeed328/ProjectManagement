import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ChatInterface, User } from "@/state/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getChatObjectMetadata = (
  chat: ChatInterface, 
  loggedInUser: User 
) => {
  // Determine the content of the last message, if any.
  // If the last message contains only attachments, indicate their count.
  const lastMessage = chat.lastMessage?.content
    ? chat.lastMessage?.content
    : chat.lastMessage
    ? `${chat.lastMessage?.attachments?.length} attachment${
        chat.lastMessage.attachments.length > 1 ? "s" : ""
      }`
    : "No messages yet"; // Placeholder text if there are no messages.

  if (chat.isGroupChat) {
    // Case: Group chat
    // Return metadata specific to group chats.
    return {

      profilePicture: "https://www.vecteezy.com/png/20911746-user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon",
      title: chat.name, // Group name serves as the title.
      description: `${chat.participants.length} members in the chat`, // Description indicates the number of members.
      lastMessage: chat.lastMessage
        ? chat.lastMessage?.sender?.username + ": " + lastMessage
        : lastMessage,
    };
  } else {
    // Case: Individual chat
    // Identify the participant other than the logged-in user.
    const participant = chat.participants.find(
      (p) => p.id !== loggedInUser?.id
    );
    // Return metadata specific to individual chats.
    return {
      profilePicture: participant?.profilePicture, // Participant's avatar URL.
      title: participant?.username, // Participant's username serves as the title.
      description: participant?.email, // Email address of the participant.
      lastMessage,
    };
  }
};

export const classNames = (...className: string[]) => {
  // Filter out any empty class names and join them with a space
  return className.filter(Boolean).join(" ");
};
