import React, { useEffect, useState } from "react";
import { getAllStats }  from "../../configs/Api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const StatsPage = () => {
  const [stats, setStats] = useState({
    revenue_total: [],
    quantity_by_category: [],
    quantity_by_tag: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getAllStats();
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="container py-5">
      <h1>Thống kê Game</h1>

      <div style={{ marginBottom: 50 }}>
        <h3>Doanh thu tổng</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.revenue_total}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

    

      <div style={{ marginBottom: 50 }}>
        <h3>Số lượng game theo Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.quantity_by_category}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="quantity" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginBottom: 50 }}>
        <h3>Số lượng game theo Tag</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.quantity_by_tag}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tag" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="quantity" fill="#ff7f50" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsPage;
