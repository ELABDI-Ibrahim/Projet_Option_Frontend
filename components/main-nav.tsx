'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, ListTodo, TrendingUp, Settings, Database } from "lucide-react";
import { useATS } from '@/lib/ats-context';
import { cn } from '@/lib/utils';

export function MainNav() {
    const pathname = usePathname();
    const { candidates, jobOffers } = useATS();

    const links = [
        { href: '/offers', label: 'Offers', icon: Briefcase, color: 'blue' },
        { href: '/lake', label: 'Lake', icon: Database, color: 'cyan' },
        { href: '/board', label: 'Job Board', icon: ListTodo, color: 'green' },
        { href: '/pipeline', label: 'Pipeline', icon: TrendingUp, color: 'purple' },
        { href: '/analytics', label: 'Analytics', icon: Settings, color: 'orange' },
    ];

    const getTabClass = (isActive: boolean, color: string) => {
        const base = "flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all text-sm font-medium";
        if (isActive) {
            switch (color) {
                case 'blue': return `${base} bg-blue-600 text-white`;
                case 'green': return `${base} bg-green-600 text-white`;
                case 'cyan': return `${base} bg-cyan-600 text-white`;
                case 'purple': return `${base} bg-purple-600 text-white`;
                case 'orange': return `${base} bg-orange-600 text-white`;
                default: return `${base} bg-slate-900 text-white`;
            }
        }
        return `${base} text-slate-500 hover:text-slate-900 hover:bg-slate-100`;
    };

    return (
        <>
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white p-2.5 rounded-lg shadow-sm">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">CVthèque ATS</h1>
                                <p className="text-sm text-slate-500 mt-0.5">Applicant Tracking & Resume Management</p>
                            </div>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <div className="bg-blue-50 px-3 py-2 rounded-lg text-blue-700 font-medium">
                                {candidates.length} Candidates
                            </div>
                            <div className="bg-green-50 px-3 py-2 rounded-lg text-green-700 font-medium">
                                {jobOffers.length} Open Roles
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6 pb-0">
                <div className="grid w-full grid-cols-4 mb-6 bg-white p-1 border border-slate-200 rounded-lg shadow-sm">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={getTabClass(isActive, link.color)}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
