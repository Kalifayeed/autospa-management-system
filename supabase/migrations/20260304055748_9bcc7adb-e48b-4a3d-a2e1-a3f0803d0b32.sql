
-- Services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read services" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add-ons table
CREATE TABLE public.add_ons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read add_ons" ON public.add_ons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage add_ons" ON public.add_ons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Attendants table
CREATE TABLE public.attendants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  shift TEXT NOT NULL DEFAULT 'morning',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read attendants" ON public.attendants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage attendants" ON public.attendants FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plate_number TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  visits INTEGER NOT NULL DEFAULT 0,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  last_visit DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plate_number TEXT NOT NULL DEFAULT '',
  vehicle_type TEXT NOT NULL DEFAULT '',
  services TEXT[] NOT NULL DEFAULT '{}',
  add_ons TEXT[] NOT NULL DEFAULT '{}',
  attendant_id TEXT NOT NULL DEFAULT '',
  attendant_name TEXT NOT NULL DEFAULT '',
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT '',
  payment_status TEXT NOT NULL DEFAULT 'paid',
  notes TEXT,
  carpet_size TEXT,
  carpet_color TEXT,
  carpet_amount NUMERIC,
  carpet_owner TEXT,
  carpet_phone TEXT,
  carpet_attendant TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read transactions" ON public.transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);

-- Seed default services
INSERT INTO public.services (name, category, price, duration, description) VALUES
  ('Regular Wash Sedan', 'Sedan', 250, 20, 'Standard exterior & interior wash for sedans'),
  ('Full Wash Sedan', 'Sedan', 300, 30, 'Complete thorough wash for sedans'),
  ('Half Wash Sedan', 'Sedan', 150, 15, 'Quick exterior-only wash for sedans'),
  ('Regular Wash SUV', 'SUV', 400, 25, 'Standard exterior & interior wash for SUVs'),
  ('Full Wash SUV', 'SUV', 500, 35, 'Complete thorough wash for SUVs'),
  ('Half Wash SUV', 'SUV', 200, 15, 'Quick exterior-only wash for SUVs'),
  ('Bike Wash Full', 'Bike', 100, 15, 'Full motorcycle wash'),
  ('Bike Wash Half', 'Bike', 50, 10, 'Quick motorcycle rinse');

-- Seed default add-ons
INSERT INTO public.add_ons (name, price) VALUES
  ('Engine Wash', 200),
  ('Under Wash', 200),
  ('Steam Wash 5 Seater', 1500),
  ('Steam Wash 7 Seater', 2000),
  ('Waxing', 700),
  ('Tire Shine', 100),
  ('Dashboard Polish', 100);

-- Seed default attendants
INSERT INTO public.attendants (name, phone, shift) VALUES
  ('Eugene', '0712345678', 'morning'),
  ('Ezra', '0723456789', 'morning'),
  ('Sammy', '0734567890', 'afternoon'),
  ('Simo', '0745678901', 'afternoon');
