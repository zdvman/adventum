import { callStaffBackfillProfileEmails } from '@/services/cloudFunctions';

function SeedProfileEmails() {
  const run = async () => {
    const result = await callStaffBackfillProfileEmails();
    alert(
      `Profile emails backfill complete. Updated ${result.updated} profiles.`
    );
  };
  return (
    <div className='p-6'>
      <p className='mb-4 text-sm text-zinc-600'>
        You must be signed in as <strong>staff</strong> to seed data.
      </p>
      <button
        onClick={run}
        className='rounded-lg bg-blue-600 px-4 py-2 text-white'
      >
        Seed sample data
      </button>
    </div>
  );
}

export default SeedProfileEmails;
