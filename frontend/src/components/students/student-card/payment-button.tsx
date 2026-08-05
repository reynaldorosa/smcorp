'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Student } from '@/types';
import { getPaymentButtonStyle } from './utils';

interface PaymentButtonProps {
  student: Student;
  onClick: () => void;
}

interface PaymentHistoryRecord {
  confirmedBy?: string;
}

/**
 * Payment status button
 * Shows current payment state and opens payment dialog
 */
export const PaymentButton: React.FC<PaymentButtonProps> = ({ student, onClick }) => {
  const amountPaid = student.payments?.totalPaid || 0;
  const totalAmount = student.totalValue || 0;
  const allConfirmed =
    student.payments?.history?.every((p: PaymentHistoryRecord) => p.confirmedBy) || false;

  const buttonStyle = getPaymentButtonStyle(amountPaid, totalAmount, allConfirmed);

  const getIcon = () => {
    if (amountPaid === 0) {
      return <XCircle className="w-3.5 h-3.5" />;
    } else if (amountPaid < totalAmount) {
      return <AlertCircle className="w-3.5 h-3.5" />;
    } else {
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex-1 min-w-0 flex items-center justify-center gap-0.5 h-9 px-1.5 text-[10px] font-bold tracking-tight ${buttonStyle}`}
    >
      {getIcon()}
      PAG
    </Button>
  );
};
