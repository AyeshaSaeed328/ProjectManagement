import { User } from "@/state/api";
import Image from "next/image";
import React from "react";

type Props = {
  user: Partial<User>;
  desc?: string
};

const UserCard = ({ user, desc }: Props) => {
  return (
    <div className="flex items-center space-x-3 mt-2 pb-6 lg:pb-8 px-4">
            <Image          
            src={user?.profilePicture ?? "/default-avatar.png"}
              alt="Manager Profile"
              className="w-10 h-10 rounded-full object-cover border"
              width={40}
              height={40}
            />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">
                  {user?.username ?? "Unknown"}
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{desc}</p>
            </div>
          </div>
  );
};

export default UserCard;