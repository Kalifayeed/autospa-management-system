CREATE TABLE public.cash_reconciliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_cash NUMERIC NOT NULL DEFAULT 0,
  counted_cash NUMERIC NOT NULL DEFAULT 0,
  variance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  recorded_by_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

ALTER TABLE public.cash_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reconciliations"
ON public.cash_reconciliations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert reconciliations"
ON public.cash_reconciliations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reconciliations"
ON public.cash_reconciliations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));