// src/pages/CreateEvent.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Text } from '@/components/catalyst-ui-kit/text';
import { Button } from '@/components/catalyst-ui-kit/button';
import {
  Field,
  Label,
  Description,
} from '@/components/catalyst-ui-kit/fieldset';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Textarea } from '@/components/catalyst-ui-kit/textarea';
import { Select } from '@/components/catalyst-ui-kit/select';

import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import AlertPopup from '@/components/ui/AlertPopup';
import Loading from '@/components/ui/Loading';

import {
  listCategories,
  createCategoryIfUnique,
  listVenues,
  createVenueIfUnique,
  createEventDraft,
  publishEvent,
} from '@/services/api';
import { Avatar } from '@/components/catalyst-ui-kit/avatar';
import { Divider } from '@/components/catalyst-ui-kit/divider';

const CURRENCIES = ['GBP', 'USD', 'EUR'];

export default function CreateEvent() {
  const { user, initializing } = useAuth();
  const navigate = useNavigate();

  // ---- base fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aboutHtml, setAboutHtml] = useState('');
  const [image, setImage] = useState('/images/events/placeholder.png');

  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [capacity, setCapacity] = useState(0);

  const [priceType, setPriceType] = useState('free'); // free | payWhatYouWant | fixed
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState('GBP');

  const [organizerName, setOrganizerName] = useState('');
  const [organizerWebsite, setOrganizerWebsite] = useState('');

  // ---- category pick/create
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // ---- venue pick/create
  const [venues, setVenues] = useState([]);
  const [venueId, setVenueId] = useState('');
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueAddress, setNewVenueAddress] = useState(null);

  // ---- UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    async function bootstrap() {
      try {
        const [cats, vens] = await Promise.all([
          listCategories(),
          listVenues(),
        ]);
        if (ignore) return;
        setCategories(cats);
        setVenues(vens);
      } catch (e) {
        setAlertTitle('Failed to load form');
        setAlertMessage(e?.message || 'Please try again.');
        setIsAlertOpen(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    bootstrap();
    return () => (ignore = true);
  }, []);

  function buildPayload() {
    return {
      title: title.trim(),
      description: description.trim(),
      aboutHtml,
      categoryId: categoryId || null,
      // keep denormalized name for fast reads (your current schema)
      categoryName: categories.find((c) => c.id === categoryId)?.name || '',
      image: image.trim(),
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      capacity: Number(capacity) || 0,
      priceType,
      price: priceType === 'fixed' ? Number(price) || 0 : 0,
      currency,
      organizerName: organizerName.trim() || null,
      organizerWebsite: organizerWebsite.trim() || null,
      venueId: venueId || null,
      ticketTypes: [], // MVP — can add an editor later
    };
  }

  async function onAddCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createCategoryIfUnique(newCategoryName.trim());
      setCategories((prev) =>
        [...prev.filter((c) => c.id !== cat.id), cat].sort((a, b) =>
          (a.name || '').localeCompare(b.name || '')
        )
      );
      setCategoryId(cat.id);
      setNewCategoryName('');
    } catch (e) {
      setAlertTitle('Could not add category');
      setAlertMessage(e?.message || 'Try again.');
      setIsAlertOpen(true);
    }
  }

  async function onAddVenue(e) {
    e.preventDefault();
    if (!newVenueName.trim()) return;
    try {
      const ven = await createVenueIfUnique({
        name: newVenueName.trim(),
        address: newVenueAddress,
      });
      setVenues((prev) =>
        [...prev.filter((v) => v.id !== ven.id), ven].sort((a, b) =>
          (a.name || '').localeCompare(b.name || '')
        )
      );
      setVenueId(ven.id);
      setNewVenueName('');
      setNewVenueAddress(null);
    } catch (e) {
      setAlertTitle('Could not add venue');
      setAlertMessage(e?.message || 'Try again.');
      setIsAlertOpen(true);
    }
  }

  async function handleSaveDraft(e) {
    e.preventDefault();
    if (!user?.uid) return;

    // simple validation
    if (!title.trim()) {
      setAlertTitle('Missing title');
      setAlertMessage('Please enter a title.');
      setIsAlertOpen(true);
      return;
    }
    if (!startsAt || !endsAt) {
      setAlertTitle('Missing dates');
      setAlertMessage('Please select both start and end date/time.');
      setIsAlertOpen(true);
      return;
    }
    if (priceType === 'fixed' && (Number(price) || 0) < 0) {
      setAlertTitle('Invalid price');
      setAlertMessage('Price must be 0 or more.');
      setIsAlertOpen(true);
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      const ev = await createEventDraft(user.uid, payload);
      setAlertTitle('Draft saved');
      setAlertMessage('Your event has been saved as a draft.');
      setIsAlertOpen(true);
      navigate(`/events/${ev.id}/edit`, { replace: true });
    } catch (err) {
      setAlertTitle('Save failed');
      setAlertMessage(err?.message || 'Please try again.');
      setIsAlertOpen(true);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(e) {
    e.preventDefault();
    if (!user?.uid) return;

    // same validation as save
    if (!title.trim() || !startsAt || !endsAt) {
      setAlertTitle('Incomplete form');
      setAlertMessage('Title, start and end date/time are required.');
      setIsAlertOpen(true);
      return;
    }

    setPublishing(true);
    try {
      // Create draft first (so we have an eventId), then call server publish
      const payload = buildPayload();
      const ev = await createEventDraft(user.uid, payload);
      await publishEvent(ev.id); // Cloud Function sets moderationStatus='pending'
      setAlertTitle('Submitted for review');
      setAlertMessage('Your event is published and pending staff approval.');
      setIsAlertOpen(true);
      navigate(`/account/events`, { replace: true });
    } catch (err) {
      setAlertTitle('Publish failed');
      setAlertMessage(err?.message || 'Please try again.');
      setIsAlertOpen(true);
    } finally {
      setPublishing(false);
    }
  }

  if (initializing || loading) return <Loading label='Loading…' />;

  return (
    <>
      <form className='space-y-12' onSubmit={handleSaveDraft} noValidate>
        <section className='border-b border-white/10 pb-10'>
          <Heading>Create event</Heading>
          <Text>Save a draft or publish for staff moderation.</Text>

          <div className='mt-8 grid grid-cols-1 gap-6 sm:grid-cols-6'>
            {/* Title */}
            <div className='col-span-full'>
              <Field>
                <Label>Title</Label>
                <Input
                  value={title}
                  type='text'
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Field>
            </div>
            {/* Media */}
            <div className='sm:col-span-1'>
              <Avatar src={image} className='size-30' />
            </div>
            <div className='sm:col-span-5'>
              <Field>
                <Label>Cover image URL</Label>
                <Input
                  type='url'
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
                <Description>
                  URL of an image to represent your event (optional).
                  Recommended size: 1200x600px. PNG or JPG format.
                </Description>
              </Field>
            </div>

            {/* Description / About */}
            <div className='sm:col-span-2'>
              <Field>
                <Label>Short description</Label>
                <Description>
                  A brief summary shown in event listings.
                </Description>
                <Textarea
                  rows={5}
                  value={description}
                  type='text'
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
            </div>
            <div className='sm:col-span-4'>
              <Field>
                <Label>About (HTML allowed)</Label>
                <Description>
                  Plain HTML accepted (no scripts). Keep it short and sweet.
                </Description>
                <Textarea
                  rows={5}
                  value={aboutHtml}
                  type='text'
                  onChange={(e) => setAboutHtml(e.target.value)}
                />
              </Field>
            </div>

            <Divider className='col-span-full mt-4' />

            {/* Category select + add */}
            <div className='sm:col-span-4'>
              <div className='col-span-full'>
                <Field>
                  <Label>Category</Label>
                  <Select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value=''>— Choose —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className='col-span-full mt-4'>
                <Field>
                  <Label>Add a new category</Label>
                  <div className='flex mt-3 gap-4'>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder='e.g., Meetups'
                      className='flex-1'
                    />
                    <Button
                      type='button'
                      onClick={onAddCategory}
                      className='shrink-0 sm:w-32'
                    >
                      Add
                    </Button>
                  </div>
                </Field>
              </div>
            </div>

            {/* Dates */}
            <div className='sm:col-span-2'>
              <div className='col-span-full'>
                <Field>
                  <Label>Starts at</Label>
                  <Input
                    type='datetime-local'
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    required
                  />
                </Field>
              </div>
              <div className='col-span-full mt-4'>
                <Field>
                  <Label>Ends at</Label>
                  <Input
                    type='datetime-local'
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    required
                  />
                </Field>
              </div>
            </div>

            <Divider className='col-span-full mt-4' />

            {/* Capacity */}
            <div className='sm:col-span-2'>
              <Field>
                <Label>Capacity</Label>
                <Input
                  type='number'
                  min={0}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </Field>
            </div>

            {/* Pricing */}
            <div className='sm:col-span-2'>
              <Field>
                <Label>Price type</Label>
                <Select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value)}
                >
                  <option value='free'>Free</option>
                  <option value='payWhatYouWant'>Pay what you want</option>
                  <option value='fixed'>Fixed price</option>
                </Select>
              </Field>
            </div>
            <div className='sm:col-span-1'>
              <Field>
                <Label>Price</Label>
                <Input
                  type='number'
                  min={0}
                  step='0.01'
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={priceType !== 'fixed'}
                />
              </Field>
            </div>
            <div className='sm:col-span-1'>
              <Field>
                <Label>Currency</Label>
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={priceType === 'free'}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Divider className='col-span-full mt-4' />

            {/* Organizer */}
            <div className='sm:col-span-3'>
              <div className='col-span-full'>
                <Field>
                  <Label>Organizer name</Label>
                  <Input
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                  />
                </Field>
              </div>
              <div className='col-span-full mt-4'>
                <Field>
                  <Label>Organizer website</Label>
                  <Input
                    type='url'
                    value={organizerWebsite}
                    onChange={(e) => setOrganizerWebsite(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* Venue select/create */}
            <div className='sm:col-span-3'>
              <div className='col-span-full'>
                <Field>
                  <Label>Venue</Label>
                  <Select
                    value={venueId}
                    onChange={(e) => setVenueId(e.target.value)}
                  >
                    <option value=''>— Choose —</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                        {v.city ? ` (${v.city})` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className='col-span-full mt-4'>
                <Field>
                  <Label>Create a new venue</Label>
                  <div className='flex mt-3 gap-4'>
                    <Input
                      value={newVenueName}
                      onChange={(e) => setNewVenueName(e.target.value)}
                      placeholder='Venue name'
                    />
                    <Button
                      type='button'
                      onClick={onAddVenue}
                      className='shrink-0 sm:w-32'
                    >
                      Add venue
                    </Button>
                  </div>
                </Field>
              </div>
            </div>
            <div className='col-span-full'>
              <AddressAutocomplete
                value={newVenueAddress}
                onChange={setNewVenueAddress}
                label='Venue address'
              />
            </div>
          </div>
        </section>

        <div className='mt-2 flex items-center justify-end gap-x-3'>
          <Button plain type='button' onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            color='zinc'
            type='submit'
            disabled={saving || publishing}
            className='shrink-0 sm:w-32'
          >
            {saving ? 'Saving…' : 'Save draft'}
          </Button>
          <Button
            color='indigo'
            type='button'
            onClick={handlePublish}
            disabled={saving || publishing}
          >
            {publishing ? 'Publishing…' : 'Publish for review'}
          </Button>
        </div>
      </form>

      {(saving || publishing) && (
        <Loading label={saving ? 'Saving…' : 'Publishing…'} />
      )}

      <AlertPopup
        isOpen={isAlertOpen}
        setIsOpen={setIsAlertOpen}
        title={alertTitle}
        description={alertMessage}
        confirmText='OK'
      />
    </>
  );
}
