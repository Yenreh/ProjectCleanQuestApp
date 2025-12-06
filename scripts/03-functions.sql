-- Funciones SQL básicas para CleanQuest
-- Ejecutar después de 01-create-tables.sql
-- NOTA: La lógica de negocio se maneja en la aplicación (db.ts), no en la DB

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END;
$$;

-- Function to update last_updated timestamp on challenge_progress
CREATE OR REPLACE FUNCTION update_challenge_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for challenge_progress updates
DROP TRIGGER IF EXISTS update_challenge_progress_timestamp ON challenge_progress;
CREATE TRIGGER update_challenge_progress_timestamp
  BEFORE UPDATE ON challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_progress_timestamp();

-- Function to auto-expire challenges (called from backend)
CREATE OR REPLACE FUNCTION expire_old_challenges() RETURNS void AS $$
BEGIN
  UPDATE active_challenges
  SET status = 'expired'
  WHERE status = 'active'
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;
