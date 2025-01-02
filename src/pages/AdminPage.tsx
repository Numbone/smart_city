import { Button } from '@/components/ui/button'
import { TableContainer } from '@/entities/Lighting/TableContainer'
import React from 'react';
import { useNavigate } from "react-router-dom";
import BackIcon from "@/assets/back.svg";
export const AdminPage = () => {
    const navigate =useNavigate();
  return (
    <div>
        <div className="flex gap-4 p-4 rounded-2xl bg-white w-1/2">
            <Button onClick={()=>navigate(-1)} variant={"outline"} >
                <img src={BackIcon} alt="BackIcon" className="fill-lime-800" />
            </Button>
            </div>
        <TableContainer/>
    </div>
    
  )
}

