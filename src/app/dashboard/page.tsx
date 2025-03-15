"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addMonths } from "date-fns";
// @ts-ignore - Fix for missing types in recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Define the merger data type
type Merger = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  industry: string;
};

// Define chart data type
type ChartDataItem = {
  name: string;
  count: number;
  month: string;
};

// Generate placeholder data
const generatePlaceholderData = (): Merger[] => {
  const industries = [
    "Technology",
    "Healthcare",
    "Energy",
    "Financial Services",
    "Retail",
    "Media",
    "Telecommunications",
    "Manufacturing",
    "Consumer Goods",
    "Transportation"
  ];
  
  const mergers: Merger[] = [];
  const currentDate = new Date();
  
  // Generate 50 random mergers over the past 2 years
  for (let i = 0; i < 50; i++) {
    const startMonthsAgo = Math.floor(Math.random() * 24); // Random start date within past 24 months
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - startMonthsAgo,
      Math.floor(Math.random() * 28) + 1
    );
    
    const durationMonths = Math.floor(Math.random() * 6) + 1; // 1-6 months duration
    const endDate = i % 10 === 0 ? null : new Date(startDate);
    if (endDate) endDate.setMonth(endDate.getMonth() + durationMonths);
    
    mergers.push({
      id: `merger-${i}`,
      name: `Merger Case ${i + 1}`,
      startDate,
      endDate,
      industry: industries[Math.floor(Math.random() * industries.length)]
    });
  }
  
  return mergers;
};

const Dashboard = () => {
  const allMergers = useMemo(() => generatePlaceholderData(), []);
  const [mergers, setMergers] = useState<Merger[]>(allMergers);
  const [dateRange, setDateRange] = useState<{from: Date; to: Date}>({
    from: new Date(new Date().setFullYear(new Date().getFullYear() - 2)),
    to: new Date(),
  });
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Create chart data by grouping mergers by month
  const chartData = useMemo(() => {
    const data: ChartDataItem[] = [];
    const monthCounts: Record<string, number> = {};
    
    // Count mergers by month
    allMergers.forEach(merger => {
      const month = `${merger.startDate.getFullYear()}-${String(merger.startDate.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    
    // Sort months chronologically
    const sortedMonths = Object.keys(monthCounts).sort();
    
    // Create chart data array
    sortedMonths.forEach(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const name = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      data.push({
        name,
        count: monthCounts[month],
        month
      });
    });
    
    return data;
  }, [allMergers]);
  
  // Handle chart bar click to filter table
  const handleBarClick = (data: ChartDataItem) => {
    if (selectedMonth === data.month) {
      setSelectedMonth(null); // Toggle off if already selected
    } else {
      setSelectedMonth(data.month);
    }
  };
  
  // Filter mergers based on selected filters
  useEffect(() => {
    let filtered = [...allMergers];
    
    // Apply date range filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(merger => 
        merger.startDate >= dateRange.from && 
        (merger.startDate <= dateRange.to)
      );
    }
    
    // Apply industry filter
    if (selectedIndustry) {
      filtered = filtered.filter(merger => merger.industry === selectedIndustry);
    }
    
    // Apply month filter if a bar in the chart was clicked
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      filtered = filtered.filter(merger => 
        merger.startDate.getFullYear() === parseInt(year) && 
        merger.startDate.getMonth() + 1 === parseInt(month)
      );
    }
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(merger => 
        merger.name.toLowerCase().includes(term) || 
        merger.industry.toLowerCase().includes(term)
      );
    }
    
    setMergers(filtered);
  }, [allMergers, dateRange, selectedIndustry, selectedMonth, searchTerm]);
  
  // Get unique industries for the dropdown
  const industries = useMemo(() => {
    const uniqueIndustries = new Set<string>();
    allMergers.forEach(merger => uniqueIndustries.add(merger.industry));
    return Array.from(uniqueIndustries).sort();
  }, [allMergers]);
  
  // Reset all filters
  const resetFilters = () => {
    setDateRange({
      from: new Date(new Date().setFullYear(new Date().getFullYear() - 2)),
      to: new Date(),
    });
    setSelectedIndustry("");
    setSelectedMonth(null);
    setSearchTerm("");
  };
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">ACCC Merger Review Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter merger data by date range, industry, or search term
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="date-range">Date Range</Label>
                <DatePickerWithRange 
                  value={dateRange}
                  onChange={(newRange) => {
                    if (newRange?.from && newRange?.to) {
                      setDateRange({ from: newRange.from, to: newRange.to });
                    } else if (newRange?.from) {
                      setDateRange({ from: newRange.from, to: dateRange.to });
                    } else if (newRange?.to) {
                      setDateRange({ from: dateRange.from, to: newRange.to });
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select 
                  value={selectedIndustry} 
                  onValueChange={setSelectedIndustry}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Industries</SelectItem>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name or industry"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-span-1 md:col-span-4 flex justify-end">
                <Button onClick={resetFilters} variant="outline">Reset Filters</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Mergers Over Time</CardTitle>
            <CardDescription>
              {selectedMonth 
                ? `Showing data for ${chartData.find(d => d.month === selectedMonth)?.name}` 
                : "Click on a bar to filter by month"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                  />
                  <YAxis label={{ value: 'Number of Mergers', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#82ca9d" 
                    name="Mergers Initiated" 
                    onClick={handleBarClick}
                    cursor="pointer" 
                    fillOpacity={(entry: ChartDataItem) => entry.month === selectedMonth ? 1 : 0.6}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Merger Cases</CardTitle>
          <CardDescription>
            {mergers.length} merger cases found
            {selectedMonth && ` in ${chartData.find(d => d.month === selectedMonth)?.name}`}
            {selectedIndustry && ` in ${selectedIndustry} industry`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergers.length > 0 ? (
                  mergers.map((merger) => (
                    <TableRow key={merger.id}>
                      <TableCell className="font-medium">{merger.name}</TableCell>
                      <TableCell>{merger.startDate.toLocaleDateString()}</TableCell>
                      <TableCell>
                        {merger.endDate ? merger.endDate.toLocaleDateString() : "Ongoing"}
                      </TableCell>
                      <TableCell>{merger.industry}</TableCell>
                      <TableCell>
                        {!merger.endDate ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            In Progress
                          </span>
                        ) : new Date() < merger.endDate ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Completed
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No mergers found matching the current filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard; 