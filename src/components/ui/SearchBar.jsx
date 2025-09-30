import { Input, InputGroup } from '@/components/catalyst-ui-kit/input';
import { MagnifyingGlassIcon } from '@heroicons/react/16/solid';

function SearchBar() {
  return (
    <InputGroup>
      <MagnifyingGlassIcon />
      <Input
        name='search'
        placeholder='Search events&hellip;'
        aria-label='Search'
      />
    </InputGroup>
  );
}

export default SearchBar;
