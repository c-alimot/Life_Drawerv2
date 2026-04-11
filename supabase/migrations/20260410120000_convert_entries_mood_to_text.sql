alter table public.entries
  add column mood_text text;

update public.entries
set mood_text = case
  when mood is null then null
  when mood::text in (
    'angry',
    'stressed',
    'anxious',
    'sad',
    'tired',
    'bored',
    'meh',
    'calm',
    'grateful',
    'happy',
    'inspired'
  ) then mood::text
  when trim(mood::text) ~ '^[0-9]+$' then
    case trim(mood::text)::integer
      when 0 then 'angry'
      when 1 then 'stressed'
      when 2 then 'anxious'
      when 3 then 'sad'
      when 4 then 'tired'
      when 5 then 'bored'
      when 6 then 'meh'
      when 7 then 'calm'
      when 8 then 'grateful'
      when 9 then 'happy'
      when 10 then 'inspired'
      else null
    end
  else null
end;

alter table public.entries
  drop column mood;

alter table public.entries
  rename column mood_text to mood;
