-- RPC to get all users with their auth emails (Admin only)
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'name', p.name,
      'role', p.role,
      'status', p.status,
      'phone', p.phone,
      'avatar', p.avatar,
      'bio', p.bio,
      'email', u.email,
      'email_confirmed_at', u.email_confirmed_at,
      'last_sign_in_at', u.last_sign_in_at,
      'created_at', p.created_at,
      'updated_at', p.updated_at
    )
  ) INTO result
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id;
  
  RETURN coalesce(result, '[]'::json);
END;
$$;

-- Grant execute to authenticated users (we will check role in edge function)
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO service_role;
