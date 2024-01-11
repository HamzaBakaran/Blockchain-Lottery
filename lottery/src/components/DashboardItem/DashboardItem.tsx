
import React from 'react';

interface DashboardItemProps {
  title: string;
  value: string | number;
}

const DashboardItem: React.FC<DashboardItemProps> = ({ title, value }) => (
  <div className="card mb-3">
    <div className="card-body">
      <h5 className="card-title">{title}</h5>
      <p className="card-text">{value}</p>
    </div>
  </div>
);

export default DashboardItem;
