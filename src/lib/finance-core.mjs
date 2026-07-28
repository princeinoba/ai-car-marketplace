export function calculateFinance({ price, downPayment = 0, annualRate = 6.99, termMonths = 60, tradeIn = 0, taxRate = 13 }) {
  const p = Math.max(0, Number(price)||0), down=Math.max(0,Number(downPayment)||0), trade=Math.max(0,Number(tradeIn)||0);
  const rate=Math.max(0,Math.min(40,Number(annualRate)||0)); const term=Math.max(12,Math.min(96,Math.round(Number(termMonths)||60))); const tax=Math.max(0,Math.min(25,Number(taxRate)||0));
  const taxable=Math.max(0,p-trade); const totalWithTax=taxable*(1+tax/100); const principal=Math.max(0,totalWithTax-down); const monthlyRate=rate/100/12;
  const monthly=principal===0?0:monthlyRate===0?principal/term:principal*(monthlyRate*(1+monthlyRate)**term)/((1+monthlyRate)**term-1);
  const totalPayments=monthly*term; return { price:p, taxable, taxAmount:taxable*tax/100, principal, monthly, totalPayments, totalInterest:Math.max(0,totalPayments-principal), termMonths:term, annualRate:rate };
}
