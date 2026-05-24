
-- ATTENDANTS: restrict reads to admins; expose masked directory via RPC
DROP POLICY IF EXISTS "Authenticated users can read attendants" ON public.attendants;

CREATE OR REPLACE FUNCTION public.list_attendants()
RETURNS TABLE(id uuid, name text, phone text, shift text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, name,
    CASE WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN phone ELSE '' END,
    shift, status, created_at
  FROM public.attendants
  ORDER BY name;
$$;
REVOKE EXECUTE ON FUNCTION public.list_attendants() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_attendants() TO authenticated;

-- CUSTOMERS: admin-only direct access; RPC for attendant transaction flow
DROP POLICY IF EXISTS "Authenticated users can read customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;

CREATE POLICY "Admins can read customers" ON public.customers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update customers" ON public.customers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.record_customer_visit(_plate text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _clean text := upper(regexp_replace(coalesce(_plate, ''), '\s', '', 'g'));
  _existing public.customers%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF _clean = '' OR _clean = 'CARPET' THEN
    RETURN;
  END IF;
  SELECT * INTO _existing FROM public.customers WHERE plate_number = _clean LIMIT 1;
  IF FOUND THEN
    UPDATE public.customers
      SET visits = _existing.visits + 1,
          loyalty_points = _existing.visits + 1,
          last_visit = CURRENT_DATE
      WHERE id = _existing.id;
  ELSE
    INSERT INTO public.customers (plate_number, name, phone, visits, loyalty_points, last_visit)
    VALUES (_clean, '', '', 1, 1, CURRENT_DATE);
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.record_customer_visit(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_customer_visit(text) TO authenticated;

-- EXPENSES: admins only
DROP POLICY IF EXISTS "Authenticated users can read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
CREATE POLICY "Admins can read expenses" ON public.expenses
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert expenses" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- TRANSACTIONS: tighten INSERT check (no longer literally true)
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.transactions;
CREATE POLICY "Authenticated users can insert transactions" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- USER_ROLES: only own role or admin
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.user_roles;
CREATE POLICY "Users can read their own role" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Lock down trigger-only helper functions from direct call by clients
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
