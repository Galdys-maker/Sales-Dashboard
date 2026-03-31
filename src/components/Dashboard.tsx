import React, { useMemo, useState, useEffect } from "react";
import { format, isSameDay, isSameWeek, isSameMonth, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Package, Users, Percent, TrendingUp, Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { supabase, SalesDataRow } from "../lib/supabase";
import AdminForm from "./AdminForm";

type Product = "Kombucha" | "Mpills" | "Other";
type Team = "Akvizice" | "Retence";

interface SalesRecord {
  id: number;
  date: string;
  callerName: string;
  team: Team;
  product: Product;
  contacts: number;
  boxes: number;
}

const TARGET_BOXES_DAILY = 50;
const TARGET_BOXES_WEEKLY = 250;
const TARGET_BOXES_MONTHLY = 1000;

export default function Dashboard() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [productFilter, setProductFilter] = useState<Product | "All">("All");
  const [teamFilter, setTeamFilter] = useState<Team | "All">("All");
  const [salesData, setSalesData] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const today = new Date();

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchSalesData() {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("sales_data")
        .select("*");

      if (fetchError) {
        console.error("Error fetching sales data:", fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (data) {
        const formattedData: SalesRecord[] = data.map((row: SalesDataRow) => ({
          id: row.id,
          date: row.data,
          callerName: row.name,
          team: row.team as Team,
          product: row.product as Product,
          contacts: row.contacts,
          boxes: row.boxes,
        }));
        setSalesData(formattedData);
      }
      
      setLoading(false);
    }

    fetchSalesData();
  }, [refreshKey]);

  const filteredData = useMemo(() => {
    return salesData.filter((record) => {
      const recordDate = parseISO(record.date);
      
      let dateMatch = false;
      if (period === "today") {
        dateMatch = isSameDay(recordDate, today);
      } else if (period === "week") {
        dateMatch = isSameWeek(recordDate, today, { weekStartsOn: 1 });
      } else if (period === "month") {
        dateMatch = isSameMonth(recordDate, today);
      }

      const productMatch = productFilter === "All" || record.product === productFilter;
      const teamMatch = teamFilter === "All" || record.team === teamFilter;

      return dateMatch && productMatch && teamMatch;
    });
  }, [salesData, period, productFilter, teamFilter]);

  const kpis = useMemo(() => {
    const totalBoxes = filteredData.reduce((sum, r) => sum + r.boxes, 0);
    const totalContacts = filteredData.reduce((sum, r) => sum + r.contacts, 0);
    const conversion = totalContacts > 0 ? ((totalBoxes / totalContacts) * 100).toFixed(1) : "0.0";
    
    let target = TARGET_BOXES_DAILY;
    if (period === "week") target = TARGET_BOXES_WEEKLY;
    if (period === "month") target = TARGET_BOXES_MONTHLY;

    const progress = Math.min((totalBoxes / target) * 100, 100);

    return { totalBoxes, totalContacts, conversion, target, progress };
  }, [filteredData, period]);

  const trendData = useMemo(() => {
    const groupedByDate = filteredData.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = { date: record.date, boxes: 0, contacts: 0 };
      }
      acc[record.date].boxes += record.boxes;
      acc[record.date].contacts += record.contacts;
      return acc;
    }, {} as Record<string, { date: string; boxes: number; contacts: number }>);

    return Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  const topPerformers = useMemo(() => {
    const groupedByCaller = filteredData.reduce((acc, record) => {
      if (!acc[record.callerName]) {
        acc[record.callerName] = { name: record.callerName, boxes: 0, contacts: 0 };
      }
      acc[record.callerName].boxes += record.boxes;
      acc[record.callerName].contacts += record.contacts;
      return acc;
    }, {} as Record<string, { name: string; boxes: number; contacts: number }>);

    return Object.values(groupedByCaller)
      .sort((a, b) => b.boxes - a.boxes)
      .slice(0, 5);
  }, [filteredData]);

  const getPerformanceColor = (boxes: number, target: number) => {
    const ratio = boxes / target;
    if (ratio >= 1.2) return "gold";
    if (ratio >= 1.0) return "success";
    if (ratio >= 0.8) return "warning";
    return "destructive";
  };

  const handleExportCSV = () => {
    const headers = ["Datum", "Jméno", "Tým", "Produkt", "Kontakty", "Boxy"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(r => `${r.date},"${r.callerName}","${r.team}","${r.product}",${r.contacts},${r.boxes}`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_export_${period}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-destructive font-medium">Error loading data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Sales Dashboard</h2>
        <div className="flex flex-wrap items-center space-x-2 gap-y-2">
          <Select value={period} onValueChange={(v: "today" | "week" | "month") => setPeriod(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Období" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Dnes</SelectItem>
              <SelectItem value="week">Tento týden</SelectItem>
              <SelectItem value="month">Tento měsíc</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={productFilter} onValueChange={(v: Product | "All") => setProductFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Produkt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Všechny produkty</SelectItem>
              <SelectItem value="Kombucha">Kombucha</SelectItem>
              <SelectItem value="Mpills">Mpills</SelectItem>
              <SelectItem value="Other">Jiné</SelectItem>
            </SelectContent>
          </Select>

          <Select value={teamFilter} onValueChange={(v: Team | "All") => setTeamFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tým" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Všechny týmy</SelectItem>
              <SelectItem value="Akvizice">Akvizice</SelectItem>
              <SelectItem value="Retence">Retence</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={refreshData} title="Refresh data">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={handleExportCSV} title="Export do CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vytvořené boxy</CardTitle>
            <Package className="h-4 w-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{kpis.totalBoxes}</div>
            <p className="text-xs text-primary-foreground/80 mt-1">
              {kpis.progress.toFixed(0)}% z cíle ({kpis.target})
            </p>
            <Progress value={kpis.progress} className="mt-3 bg-primary-foreground/20" indicatorClassName="bg-white" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontakty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalContacts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Celkový počet oslovených
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konverze</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.conversion}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Boxy / Kontakty
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predikce (Forecast)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(kpis.totalBoxes * 1.15)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Očekávaný výsledek
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Trend Výkonu</CardTitle>
            <CardDescription>
              Vývoj počtu vytvořených boxů v čase
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => format(parseISO(value), "dd.MM")}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(label) => format(parseISO(label as string), "dd.MM.yyyy")}
                />
                <Bar dataKey="boxes" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Performeři</CardTitle>
            <CardDescription>
              Žebříček podle vytvořených boxů
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topPerformers.map((performer, i) => {
                const individualTarget = kpis.target / 5;
                const perfColor = getPerformanceColor(performer.boxes, individualTarget);
                
                return (
                  <div key={performer.name} className="flex items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="ml-4 space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{performer.name}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span className="mr-2">{performer.contacts} kontaktů</span>
                        <span>{performer.contacts > 0 ? ((performer.boxes / performer.contacts) * 100).toFixed(1) : "0.0"}% konverze</span>
                      </div>
                    </div>
                    <div className="ml-auto font-medium flex items-center gap-2">
                      <span className="text-xl">{performer.boxes}</span>
                      <Badge variant={perfColor as "gold" | "success" | "warning" | "destructive"} className="w-2 h-2 p-0 rounded-full" />
                    </div>
                  </div>
                );
              })}
              {topPerformers.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Žádná data pro vybrané období
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminForm onDataAdded={refreshData} />
    </div>
  );
}
