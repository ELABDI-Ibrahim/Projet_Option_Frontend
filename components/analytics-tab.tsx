'use client';

import { Card } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Candidate, JobOffer } from '@/lib/mock-data';

interface AnalyticsTabProps {
  candidates: Candidate[];
  jobOffers: JobOffer[];
}

export function AnalyticsTab({ candidates, jobOffers }: AnalyticsTabProps) {
  // Calculate metrics
  const totalCVs = candidates.length;
  const pendingOffers = jobOffers.filter(j => j.status === 'Open').length;
  const closedOffers = jobOffers.filter(j => j.status !== 'Open').length;

  // Source distribution
  const sourceDistribution = candidates.reduce((acc, c) => {
    const existing = acc.find(item => item.name === c.source);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: c.source, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Status distribution
  const statusDistribution = candidates.reduce((acc, c) => {
    const existing = acc.find(item => item.name === c.status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: c.status, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = {
    'LinkedIn': '#0A66C2',
    'Local': '#10B981',
    'CVthèque': '#F59E0B',
    'Pending': '#FBBF24',
    'Next Round': '#34D399',
    'Declined': '#F87171'
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-200 bg-gradient-to-br from-blue-50 to-white">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total CVs</div>
          <div className="text-4xl font-bold text-blue-600 mt-3">{totalCVs}</div>
          <p className="text-xs text-slate-500 mt-3">In the system</p>
        </Card>

        <Card className="p-5 border border-slate-200 bg-gradient-to-br from-green-50 to-white">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Open Roles</div>
          <div className="text-4xl font-bold text-green-600 mt-3">{pendingOffers}</div>
          <p className="text-xs text-slate-500 mt-3">Active positions</p>
        </Card>

        <Card className="p-5 border border-slate-200 bg-gradient-to-br from-purple-50 to-white">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Closed Roles</div>
          <div className="text-4xl font-bold text-purple-600 mt-3">{closedOffers}</div>
          <p className="text-xs text-slate-500 mt-3">Filled positions</p>
        </Card>

        <Card className="p-5 border border-slate-200 bg-gradient-to-br from-orange-50 to-white">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Avg Score</div>
          <div className="text-4xl font-bold text-orange-600 mt-3">
            {candidates.length > 0
              ? Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length)
              : 0}
          </div>
          <p className="text-xs text-slate-500 mt-3">Candidate quality</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Distribution */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Source Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sourceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Pipeline Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Skills Analysis */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Top Skills</h3>
        <div className="space-y-3">
          {[
            { skill: 'Python', count: 4 },
            { skill: 'SQL', count: 3 },
            { skill: 'Data Analysis', count: 4 },
            { skill: 'Project Management', count: 2 },
            { skill: 'Machine Learning', count: 2 }
          ].map(item => (
            <div key={item.skill} className="flex items-center justify-between">
              <span className="text-sm">{item.skill}</span>
              <div className="flex items-center gap-2 w-32">
                <div className="h-2 bg-muted rounded-full flex-1">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(item.count / 4) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
