// import { Dialog, Switch, Transition } from "@headlessui/react";
import Modal from "../Modal";
import {
    UserGroupIcon,
    XCircleIcon,
    XMarkIcon,
} from "@heroicons/react/20/solid";
// import { createGroupChat, createUserChat, getAvailableUsers } from "../../api";
import { ChatInterface, Message, User } from "@/state/api";
import { classNames } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    useCreateOneOnOneChatMutation,
    useCreateGroupChatMutation,
    useGetAllUsersQuery,
} from "@/state/api"
import { toast } from "sonner";
import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    isGroupChat?: boolean;
}
type FormData = {
    groupName: string;
    isGroupChat: boolean;
    groupParticipants: { label: string; value: string }[];
    selectedUser: { label: string; value: string };
}

const AddChatModal = ({ isOpen, onClose, isGroupChat }: Props) => {

    const { data: res, isLoading: isUsersLoading, isError: isUsersError } = useGetAllUsersQuery();
    const users = res?.data || []
    const [createOneChat, { isLoading: isChatOneLoading }] = useCreateOneOnOneChatMutation();
    const [createGroupChat, { isLoading: isChatGroupLoading }] = useCreateGroupChatMutation();

    const {
        control,
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues:{
            isGroupChat: false
        }
    });
    const isGroupChatValue = watch("isGroupChat");


    const onSubmit = async (data: FormData) => {
       
        await createNewGroupChat(data);
        
        reset();
        onClose();
    };

    // const createNewChat = async (data: FormData) => {
    //     try {
    //         if (!data.selectedUser) return toast("Please select a user")
    //         const newChat = await createOneChat(
    //             {
    //                 receiverId: data.selectedUser.value
    //             }).unwrap();

    //         toast("Chat initiated successfully")

    //     } catch (error: any) {
    //         const errorMessage = error?.data?.message || "Failed to create chat";
    //         toast.error(errorMessage);

    //     }
    // }
    const userOptions = users.map((u) => ({ label: u.username, value: u.id }))

    const createNewGroupChat = async (data: FormData) => {
        try {
            if (!data.groupName) return toast("Select a group name");
            if (data.groupParticipants.length < 2) return toast("Group must have minimum three participants");
            const newGroup = await createGroupChat({
                name: data.groupName,
                participantIds: data.groupParticipants.map((p) => p.value)
            }).unwrap();

            toast("Group created successfully")

        } catch (error: any) {
            const errorMessage = error?.data?.message || "Failed to create chat";
            toast.error(errorMessage);

        }

    }

    const inputStyles =
        "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

    const selectStyles =
        "mb-4 block w-full rounded border border-gray-300 px-3 py-2 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";




    // useEffect(() => {
    //     // Check if the modal/dialog is not isOpen
    //     if (!isOpen) return;
    // }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} name="Create New Group" >

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" >
               <div className="flex justify-center">
    <div className="w-24 h-24 my-5 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-full shadow-lg flex items-center justify-center">
      <UserGroupIcon className="w-10 h-10 text-white" />
    </div>
  </div>


                {/* <Controller
                    control={control}
                    name="isGroupChat"
                    render={({ field }) => (
                         <div className="flex items-center space-x-2">
                            {/* <UserGroupIcon className="h-5 w-5 mr-2"/> */}
                        {/* <Switch checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="Group Chat">Group Chat</Label>
                        </div> */}
                {/* )}
                /> */} 
                <input className={inputStyles} placeholder="Enter Group Name" {...register("groupName", {required:true})}/>
                <Controller
          control={control}
          name="groupParticipants"
          render={({ field }) => (
            <Select
              {...field}
              isMulti
              options={userOptions}
              placeholder="Assign users..."
              classNamePrefix="react-select"
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: 'var(--select-bg)',
                  borderColor: state.isFocused ? '#9333ea' : 'var(--select-border)',
                  boxShadow: state.isFocused ? '0 0 0 1px #9333ea' : 'none',
                  '&:hover': {
                    borderColor: '#9333ea',
                  },
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--select-bg)',
                  zIndex: 50,
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? '#9333ea'
                    : state.isFocused
                    ? '#a855f7'
                    : 'var(--select-bg)',
                  color: state.isSelected || state.isFocused ? 'white' : 'var(--select-text)',
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#9333ea',
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: 'white',
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: 'white',
                  ':hover': {
                    backgroundColor: '#7c3aed',
                    color: 'white',
                  },
                }),
              }}
            />
          )}
            />
            <button
          type="submit"
          disabled={isChatGroupLoading}
          className="mt-4 w-full rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          { isChatGroupLoading ? "Creating..." : "Create Group"}
        </button>

            </form>
        </Modal>


    );
};

export default AddChatModal;

