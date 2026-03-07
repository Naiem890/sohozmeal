import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import formatDate from "../../Utils/formatDateString";
import { Axios } from "../../api/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TotalBill() {
  const [student, setStudent] = useState(null);
  const [name, setName] = useState("");
  const [distinctMonths, setDistinctMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [mealBillData, setMealBillData] = useState([]);

  const fetchStudentProfile = async () => {
    try {
      const res = await Axios.get("/student");
      if (res?.data?.student) {
        setStudent(res.data.student);
        setName(res.data.student.name);
      }
    } catch (err) {
      console.log("Error fetching student data:", err);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  useEffect(() => {
    const fetchDistinctMonths = async () => {
      const res = await Axios.get("/meal/months");
      setDistinctMonths(res.data);
      setSelectedMonth(res.data.slice(-1)[0]);
    };
    fetchDistinctMonths();
  }, []);

  useEffect(() => {
    const fetchBill = async () => {
      if (selectedMonth) {
        const [year, month] = selectedMonth.split("-");
        try {
          const res = await Axios.get(`/cost/student?year=${year}&month=${month}`);
          setMealBillData(res.data.mealBillData);
        } catch (err) {
          console.log("Error fetching bill data:", err);
        }
      }
    };
    fetchBill();
  }, [selectedMonth]);

  const handleMonthChange = useCallback(
    (increment) => {
      setSelectedMonth((prevMonth) => {
        const index = distinctMonths.indexOf(prevMonth);
        const newIndex = index + increment;
        return distinctMonths[
          newIndex >= 0 && newIndex < distinctMonths.length ? newIndex : index
        ];
      });
    },
    [distinctMonths]
  );

  const grandTotal = mealBillData.reduce(
    (total, item) =>
      total +
      item.mealBill.breakfast.perHeadCost +
      item.mealBill.lunch.perHeadCost +
      item.mealBill.dinner.perHeadCost,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Bill Count — <span className="text-primary">{name.split(" ")[0]}</span>
        </h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            disabled={selectedMonth === distinctMonths[0]}
            onClick={() => handleMonthChange(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-semibold min-w-28 text-center">
            {formatDate(selectedMonth)}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={selectedMonth === distinctMonths.slice(-1)[0]}
            onClick={() => handleMonthChange(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-200px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Breakfast</TableHead>
                  <TableHead>Lunch</TableHead>
                  <TableHead>Dinner</TableHead>
                  <TableHead>Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mealBillData.map((item) => {
                  const total = (
                    item.mealBill.breakfast.perHeadCost +
                    item.mealBill.lunch.perHeadCost +
                    item.mealBill.dinner.perHeadCost
                  ).toFixed(2);
                  return (
                    <TableRow key={item.date}>
                      <TableCell className="font-semibold">
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className={item.mealBill.breakfast.status ? "text-red-500" : "text-green-600"}>
                        {item.mealBill.breakfast.perHeadCost} ৳
                      </TableCell>
                      <TableCell className={item.mealBill.lunch.status ? "text-red-500" : "text-green-600"}>
                        {item.mealBill.lunch.perHeadCost} ৳
                      </TableCell>
                      <TableCell className={item.mealBill.dinner.status ? "text-red-500" : "text-green-600"}>
                        {item.mealBill.dinner.perHeadCost} ৳
                      </TableCell>
                      <TableCell className="font-semibold">{total} ৳</TableCell>
                    </TableRow>
                  );
                })}
                {mealBillData.length > 0 && (
                  <TableRow className="border-t-2 bg-muted/30">
                    <TableCell className="font-bold">Grand Total</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell className="font-bold">{grandTotal.toFixed(2)} ৳</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
