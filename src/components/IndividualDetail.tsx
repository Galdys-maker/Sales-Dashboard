import React, { useMemo, useState } from "react";
import { format, isSameDay, isSameWeek, isSameMonth, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MOCK_DATA } from "../data/mockData";
import { Package, Users, Percent, Download } from "lucide-react";
import { Button } from "./ui/button";

export default function IndividualDetail() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [selectedCaller, setSelectedCaller] = useState<string>("Jan Novák");

  const callers = useMemo(() => {
    return Array.from(new Set(MOCK_DATA.map((r) => r.callerName))).sort();
  }, []);

  const today = new Date();

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((record) => {
      const recordDate = parseISO(record.date);
      
      let dateMatch = false;
      if (period === "week") {
        dateMatch = isSameWeek(recordDate, today, { weekStartsOn: 1 });
      } else if (period === "month") {
        dateMatch = isSameMonth(recordDate, today);
      }

      return dateMatch && record.callerName === selectedCaller;
    });
  }, [period, selectedCaller]);

  const stats = useMemo(() => {
    const totalBoxes = filteredData.reduce((sum, r) => sum + r.boxes, 0);
    const totalContacts = filteredData.reduce((sum, r) => sum + r.contacts, 0);
    const conversion = totalContacts > 0 ? ((totalBoxes / totalContacts) * 100).toFixed(1) : "0.0";
    
    return { totalBoxes, totalContacts, conversion };
  }, [filteredData]);

  const trendData = useMemo(() => {
    const groupedByDate = filteredData.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = { date: record.date, boxes: 0, contacts: 0 };
      }
      acc[record.date].boxes += record.boxes;
      acc[record.date].contacts += record.contacts;
      return acc;
    }, {} as Record<string, { date: string; boxes: number; contacts: number }>);

    return Object.values(groupedByDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [filteredData]);

  const handleExportCSV = () => {
    const headers = ["Datum", "Kontakty", "Boxy", "Konverze (%)"];
    const csvContent = [
      headers.join(","),
      ...trendData.map(r => {
        const conversion = r.contacts > 0 ? ((r.boxes / r.contacts) * 100).toFixed(1) : "0.0";
        return `${r.date},${r.contacts},${r.boxes},${conversion}`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `individual_export_${selectedCaller.replace(/\s+/g, '_')}_${period}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Detail Jednotlivce</h2>
        <div className="flex items-center space-x-2">
          <Select value={selectedCaller} onValueChange={setSelectedCaller}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Vyberte callera" />
            </SelectTrigger>
            <SelectContent>
              {callers.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Období" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Tento týden</SelectItem>
              <SelectItem value="month">Tento měsíc</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleExportCSV} title="Export do CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vytvořené boxy</CardTitle>
            <Package className="h-4 w-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalBoxes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontakty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konverze</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversion}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vývoj Výkonu ({selectedCaller})</CardTitle>
            <CardDescription>
              Počet vytvořených boxů v čase
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>
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
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(label) => format(parseISO(label as string), "dd.MM.yyyy")}
                />
                <Line type="monotone" dataKey="boxes" stroke="currentColor" strokeWidth={2} className="stroke-primary" dot={{r: 4, fill: "currentColor", className: "fill-primary"}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Historie Záznamů</CardTitle>
            <CardDescription>
              Detailní rozpis výkonu po dnech
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="rounded-md border">
              <div className="relative w-full overflow-auto max-h-[350px]">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b sticky top-0 bg-background">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Datum</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Boxy</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Kontakty</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Konverze</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {trendData.slice().reverse().map((day) => {
                      const conversion = day.contacts > 0 ? ((day.boxes / day.contacts) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={day.date} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <td className="p-3 align-middle font-medium">{format(parseISO(day.date), "dd.MM.yyyy")}</td>
                          <td className="p-3 align-middle font-bold">{day.boxes}</td>
                          <td className="p-3 align-middle">{day.contacts}</td>
                          <td className="p-3 align-middle">{conversion}%</td>
                        </tr>
                      );
                    })}
                    {trendData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                          Žádná data pro vybrané období
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
