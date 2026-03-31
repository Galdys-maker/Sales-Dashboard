import { addDays, format, subDays } from "date-fns";

export type Product = "Kombucha" | "Mpills" | "Other";
export type Team = "Akvizice" | "Retence";

export interface SalesRecord {
  id: string;
  callerName: string;
  date: string;
  contacts: number;
  boxes: number;
  product: Product;
  team: Team;
}

const CALLERS = [
  { name: "Jan Novák", team: "Akvizice" as Team },
  { name: "Petr Svoboda", team: "Akvizice" as Team },
  { name: "Lucie Dvořáková", team: "Retence" as Team },
  { name: "Martin Černý", team: "Retence" as Team },
  { name: "Eva Procházková", team: "Akvizice" as Team },
  { name: "Tomáš Kučera", team: "Retence" as Team },
];

const PRODUCTS: Product[] = ["Kombucha", "Mpills", "Other"];

export const generateMockData = (days: number = 30): SalesRecord[] => {
  const data: SalesRecord[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const currentDate = subDays(today, i);
    const dateStr = format(currentDate, "yyyy-MM-dd");

    CALLERS.forEach((caller) => {
      // Randomly generate 1 to 3 records per caller per day
      const recordsCount = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < recordsCount; j++) {
        const contacts = Math.floor(Math.random() * 50) + 10;
        // Conversion rate roughly 5-20%
        const conversionRate = (Math.random() * 0.15) + 0.05;
        const boxes = Math.floor(contacts * conversionRate);
        const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];

        data.push({
          id: `${dateStr}-${caller.name}-${j}`,
          callerName: caller.name,
          date: dateStr,
          contacts,
          boxes,
          product,
          team: caller.team,
        });
      }
    });
  }

  return data;
};

export const MOCK_DATA = generateMockData(30);
