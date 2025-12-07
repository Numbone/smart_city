import { Link } from 'react-router-dom'
import AdminIcon from '../assets/admin.svg'
import BulbIcon from '../assets/bulb.svg'
import BgImg from '../assets/smart.jpg'
import { Header } from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'

export const RoutingPage = () => {
    const { user } = useAuth()
    return (
        <div className='relative flex flex-col h-screen'>
            <Header />

            <div
                className='flex justify-center items-center flex-1 h-full gap-20'
                style={{
                    background: `url(${BgImg})`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center'
                }}
            >
                <Link
                    to={'/map'}
                    className='w-40 h-40 rounded-2xl p-3 cursor-pointer flex flex-col justify-between hover:scale-105 transition-all duration-300 shadow-xl'
                    style={{
                        backgroundColor: '#a8ff78',
                        backgroundImage: 'linear-gradient(to right, #a8ff78, #78ffd6)',
                        backdropFilter: 'blur(50px)',
                    }}
                >
                    <img src={BulbIcon} alt="Bulb Icon" className='w-full h-20 mt-3' />
                    <div className='text-lg font-semibold mt-auto text-amber-500 text-center'>
                        Водный объект
                    </div>
                </Link>
                    {
                        user?.role?.name === 'Admin' && (
                            <Link
                            to={'/admin'}
                            className='w-40 h-40 rounded-2xl p-3 flex flex-col justify-between hover:scale-105 transition-all duration-300 shadow-xl'
                            style={{
                                backgroundColor: '#fdfc47',
                                backgroundImage: 'linear-gradient(to right, #fdfc47, #24fe41)',
                                backdropFilter: 'blur(50px)'
                            }}
                        >
                            <img src={AdminIcon} alt="Admin Icon" className='w-full h-20 mt-3' />
                            <div className='text-lg font-semibold mt-auto text-amber-500 text-center'>
                                Панель администратора
                            </div>
                        </Link>
                    )}
             {
                user?.role?.name === 'Admin' && (
                    <Link
                        to={'/priorities'}
                        className='w-40 h-40 rounded-2xl p-3 flex flex-col justify-between hover:scale-105 transition-all duration-300 shadow-xl'
                        style={{
                            backgroundColor: '#fdfc47',
                            backgroundImage: 'linear-gradient(to right, #fdfc47, #24fe41)',
                            backdropFilter: 'blur(50px)'
                        }}
                    >
                        <img src={BulbIcon} alt="Bulb Icon" className='w-full h-20 mt-3' />
                        <div className='text-lg font-semibold mt-auto text-amber-500 text-center'>
                            Приоритеты
                        </div>
                    </Link>
                )}
            </div>
        </div>
    )
}