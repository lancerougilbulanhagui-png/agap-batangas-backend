   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process['env']['https://vdypwgfzfczqxcbkxjns.supabase.co/rest/v1/'] || '';
   const supabaseAnonKey = process['env']['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkeXB3Z2Z6ZmN6cXhjYmt4am5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTQ1OTgsImV4cCI6MjEwNzI5MDU5OH0._buCFlD5mmHfqiT2_5IVOiev4TYqViMQCDk49hwFi7E'] || '';

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);