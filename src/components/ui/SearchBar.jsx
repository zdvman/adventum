import { Input, InputGroup } from '@/components/catalyst-ui-kit/input';
import { MagnifyingGlassIcon } from '@heroicons/react/16/solid';
import { useNavigate, useSearchParams } from 'react-router-dom';

function SearchBar({ className }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';

  function onSubmit(e) {
    e.preventDefault();
    const value =
      new FormData(e.currentTarget).get('search')?.toString().trim() || '';
    navigate(`/events${value ? `?q=${encodeURIComponent(value)}` : ''}`);
  }
  return (
    <div className={className}>
      <form onSubmit={onSubmit}>
        <InputGroup>
          <MagnifyingGlassIcon />
          <Input
            name='search'
            defaultValue={q}
            placeholder='Search events&hellip;'
            aria-label='Search'
          />
        </InputGroup>
      </form>
    </div>
  );
}

export default SearchBar;
