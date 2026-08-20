"use client";

import { useState } from 'react';
import SubTabBar from '../molecules/SubTabBar';
import BookManagementTab from '../organisms/BookManagementTab';
import BookPickupTab from '../organisms/BookPickupTab';
import BookReturnTab from '../organisms/BookReturnTab';
import LoanFeesPanel from '../organisms/LoanFeesPanel';

const TABS = ['book_management', 'book_pickup', 'book_return', 'loan_fees'] as const;
type TabId = typeof TABS[number];

export default function LibrarianBookDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('book_management');

  return (
    <div className="flex flex-col gap-6 w-full">
      <SubTabBar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabId)} />

      {activeTab === 'book_management' && <BookManagementTab />}
      {activeTab === 'book_pickup' && <BookPickupTab />}
      {activeTab === 'book_return' && <BookReturnTab />}
      {activeTab === 'loan_fees' && <LoanFeesPanel />}
    </div>
  );
}
