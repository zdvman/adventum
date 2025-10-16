// src/pages/EditEvent.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Avatar } from '@/components/catalyst-ui-kit/avatar';
import { Divider } from '@/components/catalyst-ui-kit/divider';
import { Switch } from '@/components/catalyst-ui-kit/switch';

import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import AlertPopup from '@/components/ui/AlertPopup';
import Loading from '@/components/ui/Loading';

import {
  listCategories,
  createCategoryIfUnique,
  listVenues,
  createVenueIfUnique,
  getEventById,
  updateEventFields,
  setPublishStatus, // API-layer function (see below)
} from '@/services/api';

const CURRENCIES = ['GBP', 'USD', 'EUR'];

export default function EditEvent() {
  const { user, initializing } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();

  // local form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aboutHtml, setAboutHtml] = useState('');
  const [image, setImage] = useState('/images/events/placeholder.png');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [capacity, setCapacity] = useState(0);
  const [priceType, setPriceType] = useState('free');
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState('GBP');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerWebsite, setOrganizerWebsite] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [venues, setVenues] = useState([]);
  const [venueId, setVenueId] = useState('');
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueAddress, setNewVenueAddress] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const [original, setOriginal] = useState(null); // for dirty check
  const [publishStatusLocal, setPublishStatusLocal] = useState('draft'); // switch UI
  const [moderationStatus, setModerationStatusLocal] = useState(null); // badge text

  useEffect(() => {
    let ignore = false;
    async function bootstrap() {
      try {
        const [cats, vens, ev] = await Promise.all([
          listCategories(),
          listVenues(),
          getEventById(eventId),
        ]);
        if (ignore) return;

        setCategories(cats);
        setVenues(vens);

        if (!ev) {
          setAlertTitle('Not found');
          setAlertMessage('Event does not exist or you cannot edit it.');
          setIsAlertOpen(true);
          navigate('/account/events', { replace: true });
          return;
        }

        setOriginal(ev);
        setPublishStatusLocal(ev.publishStatus || 'draft');
        setModerationStatusLocal(ev.moderationStatus ?? null);

        setTitle(ev.title || '');
        setDescription(ev.description || '');
        setAboutHtml(ev.aboutHtml || '');
        setImage(ev.image || '/images/events/placeholder.png');
        setStartsAt(ev.startsAt ? ev.startsAt.slice(0, 16) : '');
        setEndsAt(ev.endsAt ? ev.endsAt.slice(0, 16) : '');
        setCapacity(ev.capacity ?? 0);
        setPriceType(ev.priceType || 'free');
        setPrice(typeof ev.price === 'number' ? ev.price : 0);
        setCurrency(ev.currency || 'GBP');
        setOrganizerName(ev.organizerName || '');
        setOrganizerWebsite(ev.organizerWebsite || '');
        setCategoryId(ev.categoryId || '');
        setVenueId(ev.venueId || '');
      } catch (e) {
        setAlertTitle('Failed to load form');
        setAlertMessage(e?.message || 'Please try again.');
        setIsAlertOpen(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (eventId) bootstrap();
    return () => (ignore = true);
  }, [eventId, navigate]);

  // Dirty check
  const isDirty = useMemo(() => {
    if (!original) return false;

    const categoryName =
      categories.find((c) => c.id === categoryId)?.name || '';

    const payload = {
      title: title.trim(),
      description: description.trim(),
      aboutHtml,
      categoryId: categoryId || null,
      categoryName,
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
    };

    const cmp = (a, b) =>
      JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

    return !(
      cmp(payload.title, original.title) &&
      cmp(payload.description, original.description) &&
      cmp(payload.aboutHtml, original.aboutHtml) &&
      cmp(payload.categoryId, original.categoryId) &&
      cmp(payload.categoryName, original.categoryName) &&
      cmp(payload.image, original.image) &&
      cmp(payload.startsAt, original.startsAt) &&
      cmp(payload.endsAt, original.endsAt) &&
      cmp(payload.capacity, original.capacity) &&
      cmp(payload.priceType, original.priceType) &&
      cmp(payload.price, original.price) &&
      cmp(payload.currency, original.currency) &&
      cmp(payload.organizerName, original.organizerName) &&
      cmp(payload.organizerWebsite, original.organizerWebsite) &&
      cmp(payload.venueId, original.venueId)
    );
  }, [
    original,
    title,
    description,
    aboutHtml,
    categoryId,
    categories,
    image,
    startsAt,
    endsAt,
    capacity,
    priceType,
    price,
    currency,
    organizerName,
    organizerWebsite,
    venueId,
  ]);

  function buildPayload() {
    return {
      title: title.trim(),
      description: description.trim(),
      aboutHtml,
      categoryId: categoryId || null,
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
    };
  }

  // Add Category
  async function onAddCategory(e) {
    e.preventDefault();
    const name = (newCategoryName || '').trim();
    if (!name) return;

    try {
      const cat = await createCategoryIfUnique(name);
      setCategories((prev) =>
        [...prev.filter((c) => c.id !== cat.id), cat].sort((a, b) =>
          (a.name || '').localeCompare(b.name || '')
        )
      );
      setCategoryId(cat.id);
      setNewCategoryName('');
    } catch (err) {
      setAlertTitle('Could not add category');
      setAlertMessage(err?.message || 'Try again.');
      setIsAlertOpen(true);
    }
  }

  // Add Venue
  async function onAddVenue(e) {
    e.preventDefault();
    const name = (newVenueName || '').trim();
    if (!name) return;

    try {
      const ven = await createVenueIfUnique({
        name,
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
    } catch (err) {
      setAlertTitle('Could not add venue');
      setAlertMessage(err?.message || 'Try again.');
      setIsAlertOpen(true);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!user?.uid || !original) return;
    if (!isDirty) return;

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
      // any edit -> draft; moderationStatus remains unchanged
      const updated = await updateEventFields(eventId, payload, {
        keepPublished: false,
      });
      setOriginal(updated);
      setPublishStatusLocal(updated.publishStatus || 'draft');
      setModerationStatusLocal(updated.moderationStatus ?? null);

      setAlertTitle('Saved');
      setAlertMessage('Your changes have been saved as a draft.');
      setIsAlertOpen(true);
    } catch (err) {
      setAlertTitle('Save failed');
      setAlertMessage(err?.message || 'Please try again.');
      setIsAlertOpen(true);
    } finally {
      setSaving(false);
    }
  }

  // Toggle Published/Draft
  async function handleTogglePublish(checked) {
    if (!original) return;
    setToggling(true);
    try {
      const res = await setPublishStatus(eventId, checked); // now Cloud Function-backed
      setPublishStatusLocal(res.publishStatus);
      setModerationStatusLocal(res.moderationStatus ?? null);
      setOriginal((prev) => ({
        ...(prev || {}),
        publishStatus: res.publishStatus,
        moderationStatus: res.moderationStatus ?? null,
      }));
    } catch (err) {
      setAlertTitle('Update visibility failed');
      setAlertMessage(err?.message || 'Please try again.');
      setIsAlertOpen(true);
    } finally {
      setToggling(false);
    }
  }

  if (initializing || loading) return <Loading label='Loading…' />;

  return (
    <>
      <form className='space-y-12' onSubmit={handleSave} noValidate>
        <section className='border-b border-white/10 pb-10'>
          <div className='flex items-center justify-between'>
            <div>
              <Heading>Edit event</Heading>
              <Text>
                You can save changes (auto turns into draft) and then publish.
              </Text>
            </div>

            {/* Publish switch */}
            <Field className='!mb-0 grid grid-cols-[auto_auto_1fr] items-center gap-x-3'>
              <Label className='!m-0'>Visibility</Label>
              <Switch
                color='lime'
                checked={publishStatusLocal === 'published'}
                onChange={handleTogglePublish}
                disabled={toggling || saving}
              />

              <span className='text-sm text-zinc-400'>
                {publishStatusLocal === 'published' ? 'Published' : 'Draft'}
                {publishStatusLocal === 'published' &&
                  moderationStatus !== 'approved' &&
                  ' · Pending review'}
                {publishStatusLocal === 'published' &&
                  moderationStatus === 'approved' &&
                  ' · Approved'}
                {publishStatusLocal === 'published' &&
                  moderationStatus === 'rejected' &&
                  ' · Rejected'}
              </span>
            </Field>
          </div>

          {/* Title */}
          <div className='mt-8 grid grid-cols-1 gap-6 sm:grid-cols-6'>
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
              <Avatar
                src={image || '/images/events/placeholder.png'}
                className='size-30'
              />
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
            color='indigo'
            type='submit'
            disabled={saving || toggling || !isDirty}
            className='shrink-0 sm:w-32'
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>

      {(saving || toggling) && (
        <Loading label={saving ? 'Saving…' : 'Updating…'} />
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
