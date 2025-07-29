'use client'
import React from 'react'
import { useGetUserTeamQuery } from '@/state/api'
import { userColumns } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import UserCard from '@/(components)/UserCard';

const myTeam = () => {
    const {data:res, isLoading, isError} = useGetUserTeamQuery();
    const team = res?.data
    // console.log(team)
    const members = team?.members ?? [];
    const teamLead = team?.teamLead

  return (

    <>
    {teamLead && <UserCard user={teamLead} desc='Team Lead' />}
    <div className="px-6 lg:px-8" style={{ height: 400, width: "100%" }}>
             
                <DataTable columns={userColumns} data={members}
                />
               
              </div>
              </>
  )
}

export default myTeam