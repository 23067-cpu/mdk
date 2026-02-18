import React from 'react';
import {
    LineChart as RechartsLineChart,
    Line,
    BarChart as RechartsBarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';

// Color palette
const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    cyan: '#06b6d4',
    gray: '#6b7280',
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple, COLORS.pink, COLORS.cyan];

// Format currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value) + ' MRU';
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

interface LineChartProps {
    data: Array<{ name: string;[key: string]: string | number }>;
    lines: Array<{ dataKey: string; name: string; color?: string }>;
    height?: number;
    showGrid?: boolean;
}

export function LineChartComponent({ data, lines, height = 300, showGrid = true }: LineChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />}
                <XAxis
                    dataKey="name"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {lines.map((line, index) => (
                    <Area
                        key={line.dataKey}
                        type="monotone"
                        dataKey={line.dataKey}
                        name={line.name}
                        stroke={line.color || PIE_COLORS[index % PIE_COLORS.length]}
                        fill={line.color || PIE_COLORS[index % PIE_COLORS.length]}
                        fillOpacity={0.1}
                        strokeWidth={2}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
}

interface BarChartProps {
    data: Array<{ name: string;[key: string]: string | number }>;
    bars: Array<{ dataKey: string; name: string; color?: string }>;
    height?: number;
    layout?: 'horizontal' | 'vertical';
}

export function BarChartComponent({ data, bars, height = 300, layout = 'horizontal' }: BarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart
                data={data}
                layout={layout}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis
                    dataKey={layout === 'horizontal' ? 'name' : undefined}
                    type={layout === 'horizontal' ? 'category' : 'number'}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                    dataKey={layout === 'vertical' ? 'name' : undefined}
                    type={layout === 'vertical' ? 'category' : 'number'}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={layout === 'horizontal' ? (value) => `${(value / 1000).toFixed(0)}k` : undefined}
                    width={layout === 'vertical' ? 80 : 60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {bars.map((bar, index) => (
                    <Bar
                        key={bar.dataKey}
                        dataKey={bar.dataKey}
                        name={bar.name}
                        fill={bar.color || PIE_COLORS[index % PIE_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                    />
                ))}
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}

interface PieChartProps {
    data: Array<{ name: string; value: number }>;
    height?: number;
    innerRadius?: number;
    showLabels?: boolean;
}

export function PieChartComponent({ data, height = 300, innerRadius = 60, showLabels = false }: PieChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={innerRadius}
                    outerRadius={innerRadius + 40}
                    paddingAngle={2}
                    dataKey="value"
                    label={showLabels ? ({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%` : undefined}
                    labelLine={showLabels}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
            </RechartsPieChart>
        </ResponsiveContainer>
    );
}

// Stats Card with mini chart
interface StatsCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
    sparklineData?: number[];
}

const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
};

export function StatsCard({ title, value, change, changeLabel, icon, color = 'blue', sparklineData }: StatsCardProps) {
    const sparkData = sparklineData?.map((v, i) => ({ value: v })) || [];

    return (
        <div className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                    {change !== undefined && (
                        <p className={`text-sm mt-1 flex items-center gap-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            <span>{change >= 0 ? '↑' : '↓'}</span>
                            <span>{Math.abs(change)}%</span>
                            {changeLabel && <span className="text-gray-500">{changeLabel}</span>}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                        {icon}
                    </div>
                )}
            </div>

            {sparklineData && sparklineData.length > 0 && (
                <div className="mt-4 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkData}>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color === 'green' ? COLORS.success : color === 'red' ? COLORS.danger : COLORS.primary}
                                fill={color === 'green' ? COLORS.success : color === 'red' ? COLORS.danger : COLORS.primary}
                                fillOpacity={0.1}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

// Progress Bar
interface ProgressBarProps {
    value: number;
    max: number;
    label?: string;
    showPercentage?: boolean;
    color?: string;
}

export function ProgressBar({ value, max, label, showPercentage = true, color = COLORS.primary }: ProgressBarProps) {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div className="w-full">
            {(label || showPercentage) && (
                <div className="flex justify-between text-sm mb-1">
                    {label && <span className="text-gray-600 dark:text-gray-400">{label}</span>}
                    {showPercentage && <span className="font-medium text-gray-900 dark:text-white">{percentage.toFixed(0)}%</span>}
                </div>
            )}
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

export { COLORS, PIE_COLORS, formatCurrency };
