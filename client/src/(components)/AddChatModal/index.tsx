import { Dialog, Switch, Transition } from "@headlessui/react";
import {
    UserGroupIcon,
    XCircleIcon,
    XMarkIcon,
} from "@heroicons/react/20/solid";
import { Fragment, useEffect, useState } from "react";
// import { createGroupChat, createUserChat, getAvailableUsers } from "../../api";
import { ChatInterface, Message, User } from "@/state/api";
import { classNames } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    useCreateOneOnOneChatMutation,
    useCreateGroupChatMutation,
    useGetAllUsersQuery,
} from "@/state/api"
import { toast } from "sonner";


const AddChatModal: React.FC<{
    open: boolean;
    onClose: () => void;
    onSuccess: (chat: ChatInterface) => void;
}> = ({ open, onClose, onSuccess }) => {
    // State to store the list of users, initialized as an empty array
    //   const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    // State to store the name of a group, initialized as an empty string
    const [groupName, setGroupName] = useState("");
    // State to determine if the chat is a group chat, initialized as false
    const [isGroupChat, setIsGroupChat] = useState(false);
    // State to store the list of participants in a group chat, initialized as an empty array
    const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
    // State to store the ID of a selected user, initialized as null
    const [selectedUserId, setSelectedUserId] = useState<null | string>(null);
    // State to determine if a chat is currently being created, initialized as false
    const [creatingChat, setCreatingChat] = useState(false);

    // Function to fetch users
    const { data: res, isLoading: isUsersLoading, isError: isUsersError } = useGetAllUsersQuery();
    const users = res?.data ||[]
    const [createOneChat, { isLoading: isChatOneLoading }] = useCreateOneOnOneChatMutation();
    const [createGroupChat, { isLoading: isChatGroupLoading }] = useCreateGroupChatMutation();

    const createNewChat = async () => {
        try {
            if (!selectedUserId) return toast("Please select a user")
            const newChat = await createOneChat(
                {
                    receiverId: selectedUserId
                }).unwrap();
            onSuccess(newChat.data)
            handleClose();
            toast("Chat initiated successfully")

        } catch (error: any) {
            const errorMessage = error?.data?.message || "Failed to create chat";
            toast.error(errorMessage);

        }
    }

    const createNewGroupChat = async() =>{
        try {
            if (!groupName) return toast("Select a group name");
            if (groupParticipants.length < 2) return toast("Group must have minimum three participants");
            const newGroup = await createGroupChat({
                name: groupName,
                participantIds: groupParticipants
            }).unwrap();
            onSuccess(newGroup.data)
            handleClose();
            toast("Group created successfully")
            
        } catch (error: any) {
            const errorMessage = error?.data?.message || "Failed to create chat";
            toast.error(errorMessage);
            
        }

    }

    const handleClose = () => {
        setSelectedUserId("");
        setGroupName("");
        setGroupParticipants([]);
        setIsGroupChat(false);
        onClose();
    };

    useEffect(() => {
        // Check if the modal/dialog is not open
        if (!open) return;
    }, [open]);

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-visible">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel
                                className="relative transform overflow-x-hidden rounded-lg bg-dark px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6"
                                style={{
                                    overflow: "inherit",
                                }}
                            >
                                <div>
                                    <div className="flex justify-between items-center">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-semibold leading-6 text-white"
                                        >
                                            Create chat
                                        </Dialog.Title>
                                        <button
                                            type="button"
                                            className="rounded-md bg-transparent text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-2"
                                            onClick={() => handleClose()}
                                        >
                                            <span className="sr-only">Close</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <Switch.Group as="div" className="flex items-center my-5">
                                        <Switch
                                            checked={isGroupChat}
                                            onChange={setIsGroupChat}
                                            className={classNames(
                                                isGroupChat ? "bg-secondary" : "bg-zinc-200",
                                                "relative outline outline-[1px] outline-white inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-0"
                                            )}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={classNames(
                                                    isGroupChat
                                                        ? "translate-x-5 bg-success"
                                                        : "translate-x-0 bg-white",
                                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out"
                                                )}
                                            />
                                        </Switch>
                                        <Switch.Label as="span" className="ml-3 text-sm">
                                            <span
                                                className={classNames(
                                                    "font-medium text-white",
                                                    isGroupChat ? "" : "opacity-40"
                                                )}
                                            >
                                                Is it a group chat?
                                            </span>{" "}
                                        </Switch.Label>
                                    </Switch.Group>
                                    {isGroupChat ? (
                                        <div className="my-5">
                                            <Input
                                                placeholder={"Enter a group name..."}
                                                value={groupName}
                                                onChange={(e) => {
                                                    setGroupName(e.target.value);
                                                }}
                                            />
                                        </div>
                                    ) : null}
                                    <div className="my-5">
                                        <Select
                                            placeholder={
                                                isGroupChat
                                                    ? "Select group participants..."
                                                    : "Select a user to chat..."
                                            }
                                            value={isGroupChat ? "" : selectedUserId || ""}
                                            options={users.map((user: User) => {
                                                return {
                                                    label: user.username,
                                                    value: user.id,
                                                };
                                            })}
                                            onChange={({ value }) => {
                                                if (isGroupChat && !groupParticipants.includes(value)) {
                                                    // if user is creating a group chat track the participants in an array
                                                    setGroupParticipants([...groupParticipants, value]);
                                                } else {
                                                    setSelectedUserId(value);
                                                    // if user is creating normal chat just get a single user
                                                }
                                            }}
                                        />
                                    </div>
                                    {isGroupChat ? (
                                        <div className="my-5">
                                            <span
                                                className={classNames(
                                                    "font-medium text-white inline-flex items-center"
                                                )}
                                            >
                                                <UserGroupIcon className="h-5 w-5 mr-2" /> Selected
                                                participants
                                            </span>{" "}
                                            <div className="flex justify-start items-center flex-wrap gap-2 mt-3">
                                                {users
                                                    .filter((user:User) =>
                                                        groupParticipants.includes(user.id)
                                                    )
                                                    ?.map((participant) => {
                                                        return (
                                                            <div
                                                                className="inline-flex bg-secondary rounded-full p-2 border-[1px] border-zinc-400 items-center gap-2"
                                                                key={participant?.id}
                                                            >
                                                                <img
                                                                    className="h-6 w-6 rounded-full object-cover"
                                                                    src={participant.profilePicture}
                                                                />
                                                                <p className="text-white">
                                                                    {participant.username}
                                                                </p>
                                                                <XCircleIcon
                                                                    role="button"
                                                                    className="w-6 h-6 hover:text-primary cursor-pointer"
                                                                    onClick={() => {
                                                                        setGroupParticipants(
                                                                            groupParticipants.filter(
                                                                                (p) => p !== participant.id
                                                                            )
                                                                        );
                                                                    }}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="mt-5 flex justify-between items-center gap-4">
                                    <Button
                                        disabled={creatingChat}
                                        onClick={handleClose}
                                        className="w-1/2"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        disabled={creatingChat}
                                        onClick={isGroupChat ? createNewGroupChat : createNewChat}
                                        className="w-1/2"
                                    >
                                        Create
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default AddChatModal;