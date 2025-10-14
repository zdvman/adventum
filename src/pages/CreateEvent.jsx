import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Field, Label } from '@/components/catalyst-ui-kit/fieldset';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Select } from '@/components/catalyst-ui-kit/select';
import { Textarea } from '@/components/catalyst-ui-kit/textarea';
import { Button } from '@/components/catalyst-ui-kit/button';
// import { Strong, Text, TextLink } from '@/components/catalyst-ui-kit/text';

import AlertPopup from '@/components/ui/AlertPopup';
import Loading from '@/components/ui/Loading';

import {
  getVenuesMap,
  createEventDraft,
  updateEventFields,
  publishEvent,
  getEventById, // for edit mode
} from '@/services/api';

/**
 * This file supports both create and edit.
 * If it's mounted on /events/new → "create" mode.
 * If you later mount it on /events/:id/edit and pass an :id param → "edit" mode.
 */
export default function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const isEdit = Boolean(params?.id); // if you later route /events/:id/edit

  const [venuesMap, setVenuesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [values, setValues] = useState({
    title: '',
    description: '',
    image: '',
    startsAt: '',
    endsAt: '',
    venueId: '',
    capacity: 0,
    priceType: 'free', // free | fixed | payWhatYouWant
    price: 0,
    currency: 'USD',
    organizerName: '',
    organizerWebsite: '',
    refundPolicy: '',
  });

  // alert
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // bootstrap
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const vMap = await getVenuesMap();
        if (!alive) return;
        setVenuesMap(vMap);

        if (isEdit && params.id) {
          const ev = await getEventById(params.id);
          if (!alive) return;
          if (!ev) {
            setAlertTitle('Not found');
            setAlertMessage('This event does not exist.');
            setIsAlertOpen(true);
            return;
          }
          // Prefill
          setValues((prev) => ({
            ...prev,
            title: ev.title || '',
            description: ev.description || '',
            image: ev.image || '',
            startsAt: (ev.startsAt || '').replace('Z', ''), // if ISO with Z
            endsAt: (ev.endsAt || '').replace('Z', ''),
            venueId: ev.venueId || '',
            capacity: ev.capacity ?? 0,
            priceType: ev.priceType || 'free',
            price: ev.price ?? 0,
            currency: ev.currency || 'USD',
            organizerName: ev.organizerName || '',
            organizerWebsite: ev.organizerWebsite || '',
            refundPolicy: ev.refundPolicy || '',
          }));
        }
      } catch (e) {
        setAlertTitle('Failed to load form');
        setAlertMessage(e?.message || 'Please try again.');
        setIsAlertOpen(true);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [isEdit, params?.id]);

  const venueOptions = useMemo(
    () =>
      Object.values(venuesMap).map((v) => ({ id: v.id, name: v.name || v.id })),
    [venuesMap]
  );

  if (loading)
    return <Loading label={isEdit ? 'Loading event…' : 'Loading…'} />;

  function setField(name, val) {
    setValues((v) => ({ ...v, [name]: val }));
  }

  function validate() {
    if (!values.title.trim()) return 'Title is required.';
    if (!values.startsAt) return 'Start date/time is required.';
    if (!values.endsAt) return 'End date/time is required.';
    if (new Date(values.endsAt) <= new Date(values.startsAt))
      return 'End must be after start.';
    if (values.priceType === 'fixed' && (values.price ?? 0) < 0)
      return 'Price must be ≥ 0.';
    return null;
  }

  async function handleSaveDraft() {
    const error = validate();
    if (error) {
      setAlertTitle('Validation error');
      setAlertMessage(error);
      setIsAlertOpen(true);
      return;
    }
    setSaving(true);
    try {
      if (!user?.uid) throw new Error('You must be signed in.');
      // normalize ISO
      const payload = {
        ...values,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
      };
      if (isEdit && params.id) {
        await updateEventFields(params.id, {
          ...payload,
          publishStatus: 'draft',
        });
      } else {
        await createEventDraft(user.uid, payload);
      }
      // success → go to My Events
      navigate('/account/events', { replace: true });
    } catch (e) {
      setAlertTitle('Save failed');
      setAlertMessage(e?.message || 'Could not save event.');
      setIsAlertOpen(true);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    const error = validate();
    if (error) {
      setAlertTitle('Validation error');
      setAlertMessage(error);
      setIsAlertOpen(true);
      return;
    }
    setSaving(true);
    try {
      if (!user?.uid) throw new Error('You must be signed in.');
      // 1) Save fields (and force draft in case of new/dirty edits)
      const payload = {
        ...values,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
      };
      let id = params.id;
      if (isEdit && id) {
        await updateEventFields(id, { ...payload, publishStatus: 'draft' });
      } else {
        const created = await createEventDraft(user.uid, payload);
        id = created.id;
      }
      // 2) Publish via callable → sets moderationStatus: 'pending'
      await publishEvent(id);

      setAlertTitle('Submitted for review');
      setAlertMessage(
        'Your event was published and sent to staff for approval. It will appear publicly once approved.'
      );
      setIsAlertOpen(true);
      // After OK, send them to My Events
    } catch (e) {
      setAlertTitle('Publish failed');
      setAlertMessage(e?.message || 'Could not publish event.');
      setIsAlertOpen(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className='max-w-3xl'>
        <Heading>{isEdit ? 'Edit event' : 'Create event'}</Heading>

        <div className='mt-8 grid grid-cols-1 gap-6'>
          <Field>
            <Label>Title</Label>
            <Input
              name='title'
              value={values.title}
              onChange={(e) => setField('title', e.target.value)}
              required
            />
          </Field>

          <Field>
            <Label>Description</Label>
            <Textarea
              name='description'
              rows={6}
              value={values.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </Field>

          <div className='grid gap-6 sm:grid-cols-2'>
            <Field>
              <Label>Starts at</Label>
              <Input
                type='datetime-local'
                value={values.startsAt}
                onChange={(e) => setField('startsAt', e.target.value)}
                required
              />
            </Field>
            <Field>
              <Label>Ends at</Label>
              <Input
                type='datetime-local'
                value={values.endsAt}
                onChange={(e) => setField('endsAt', e.target.value)}
                required
              />
            </Field>
          </div>

          <div className='grid gap-6 sm:grid-cols-2'>
            <Field>
              <Label>Venue</Label>
              <Select
                value={values.venueId}
                onChange={(e) => setField('venueId', e.target.value)}
              >
                <option value=''>— Select a venue —</option>
                {venueOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <Label>Capacity</Label>
              <Input
                type='number'
                min={0}
                value={values.capacity}
                onChange={(e) =>
                  setField('capacity', Number(e.target.value || 0))
                }
              />
            </Field>
          </div>

          <div className='grid gap-6 sm:grid-cols-3'>
            <Field>
              <Label>Price type</Label>
              <Select
                value={values.priceType}
                onChange={(e) => setField('priceType', e.target.value)}
              >
                <option value='free'>Free</option>
                <option value='fixed'>Fixed price</option>
                <option value='payWhatYouWant'>Pay what you want</option>
              </Select>
            </Field>

            <Field>
              <Label>Price (if fixed)</Label>
              <Input
                type='number'
                min={0}
                step='0.01'
                value={values.price}
                onChange={(e) => setField('price', Number(e.target.value || 0))}
                disabled={values.priceType !== 'fixed'}
              />
            </Field>

            <Field>
              <Label>Currency</Label>
              <Input
                value={values.currency}
                onChange={(e) =>
                  setField('currency', e.target.value.toUpperCase())
                }
              />
            </Field>
          </div>

          <Field>
            <Label>Header image URL</Label>
            <Input
              value={values.image}
              onChange={(e) => setField('image', e.target.value)}
              placeholder='/images/events/sample.jpg'
            />
          </Field>

          <div className='grid gap-6 sm:grid-cols-2'>
            <Field>
              <Label>Organizer name</Label>
              <Input
                value={values.organizerName}
                onChange={(e) => setField('organizerName', e.target.value)}
              />
            </Field>
            <Field>
              <Label>Organizer website</Label>
              <Input
                value={values.organizerWebsite}
                onChange={(e) => setField('organizerWebsite', e.target.value)}
                placeholder='https://…'
              />
            </Field>
          </div>

          <Field>
            <Label>Refund policy</Label>
            <Input
              value={values.refundPolicy}
              onChange={(e) => setField('refundPolicy', e.target.value)}
              placeholder="e.g. 'Free RSVP — cancel if you can’t attend.'"
            />
          </Field>

          <div className='mt-6 flex flex-wrap gap-3'>
            <Button color='zinc' onClick={handleSaveDraft} disabled={saving}>
              {saving ? 'Saving…' : 'Save draft'}
            </Button>
            <Button color='indigo' onClick={handlePublish} disabled={saving}>
              {saving ? 'Publishing…' : 'Publish (send to review)'}
            </Button>
            <Button plain href='/account/events'>
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <AlertPopup
        isOpen={isAlertOpen}
        setIsOpen={(open) => {
          // if success publish message, on close redirect
          if (!open && alertTitle === 'Submitted for review') {
            navigate('/account/events', { replace: true });
          }
          setIsAlertOpen(open);
        }}
        title={alertTitle}
        description={alertMessage}
        confirmText='OK'
      />
    </>
  );
}
