import React from 'react'
import BgImg from '../assets/smart.jpg'
import BulbIcon from '../assets/bulb.svg'
import AdminIcon from '../assets/admin.svg'
import { Link } from 'react-router-dom'
export const RoutingPage = () => {
    return (
        <div className='flex justify-center items-center flex-1 h-full gap-20' style={{
            background: `url(${BgImg})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
        }}>
            <Link to={'/map'} className='w-40 h-40 rounded-2xl p-3 cursor-pointer flex flex-col justify-between' style={{
                backgroundColor: ' #a8ff78',
                backgroundImage: 'linear-gradient(to right, #a8ff78, #78ffd6)',
                backdropFilter: 'blur(50px)'
            }}>
                <img src={BulbIcon} alt="Bulb Icon" className='w-full h-20 mt-3' />
                <div className='text-lg font-semibold mt-auto text-amber-500 text-center'>
                    Lighting Control
                </div>

            </Link>
            <Link to={'/admin'} className='w-40 h-40 rounded-2xl p-3 flex flex-col justify-between' style={{
                backgroundColor: ' #fdfc47',
                backgroundImage: 'linear-gradient(to right, #fdfc47, #24fe41)',
                backdropFilter: 'blur(50px)'
            }}>
                <img src={AdminIcon} alt="Bulb Icon" className='w-full h-20 mt-3' />
                <div className='text-lg font-semibold mt-auto text-amber-500 text-center'>
                    Admin Panel
                </div>

            </Link>
        </div>
    )
}

