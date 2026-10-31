import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AccessibilityControls from './AccessibilityControls';
import LiveCaption from './LiveCaption';
import { useAccessibility } from '../context/AccessibilityContext';
import { Menu } from 'lucide-react';

const Layout = () => {
    const { highContrast } = useAccessibility();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    return (
        <div
            className={`flex min-h-screen transition-colors duration-300 ${highContrast ? 'bg-black' : 'bg-gray-50'
                }`}
            style={{ '--sidebar-width': isCollapsed ? '80px' : '256px' }}
        >
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            { }
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'
                }`}>
                { }
                <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu size={22} className="text-gray-700" />
                    </button>
                    <span className="font-bold text-blue-600 text-lg">CyberNinjas</span>
                </div>

                { }
                <main className="flex-1 px-4 md:px-8 py-5 overflow-y-auto relative">
                    <AccessibilityControls />
                    <LiveCaption />
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
