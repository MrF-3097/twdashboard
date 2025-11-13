'use client'

import React, { useEffect, useState } from "react";
import dynamic from 'next/dynamic';

// Dynamically import ApexCharts to prevent SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts').then(mod => mod.default), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-white/50">Loading chart...</div>
});

type ChartProps = {
  chartData: any[];
  chartOptions: any;
};

const HorizonLineChart: React.FC<ChartProps> = ({ chartData, chartOptions }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="w-full h-full flex items-center justify-center text-white/50">Loading chart...</div>;
  }

  return (
    <ReactApexChart
      options={chartOptions}
      series={chartData}
      type="line"
      width="100%"
      height="100%"
    />
  );
};

export default HorizonLineChart;

