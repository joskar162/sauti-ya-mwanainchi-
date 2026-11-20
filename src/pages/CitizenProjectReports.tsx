import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/context/ProjectsContext';
import { useReports } from '@/context/ReportsContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { FUNDING_TYPES, PROJECT_STATUSES, SECTORS } from '@/utils/constants';
import type { FundingType, GeoCoordinates, Project, ProjectStatus } from '@/types';

const MAX_PHOTOS = 3;
const MAX_SOURCE_PHOTO_SIZE = 12 * 1024 * 1024;
const MAX_COMPRESSED_PHOTO_SIZE = 100 * 1024;
const MAX_TOTAL_PHOTO_DATA_URL_LENGTH = 450_000;

const parseSources = (value: string) => value
  .split('\n')
  .map(source => source.trim())
  .filter(Boolean);

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Could not read the selected photo.'));
  reader.onload = () => {
    if (typeof reader.result === 'string') resolve(reader.result);
    else reject(new Error('Could not process the selected photo.'));
  };
  reader.readAsDataURL(blob);
});

const compressPhoto = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > MAX_SOURCE_PHOTO_SIZE) throw new Error('Each photo must be smaller than 12 MB.');
  if (typeof createImageBitmap !== 'function') throw new Error('This browser cannot process photos. Try a newer browser.');

  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    let quality = 0.76;

    for (let attempt = 0; attempt < 8; attempt++) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare the photo for upload.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (!blob) throw new Error('Could not compress the selected photo.');
      if (blob.size <= MAX_COMPRESSED_PHOTO_SIZE) return blobToDataUrl(blob);

      if (quality > 0.46) quality -= 0.1;
      else scale *= 0.8;
    }
  } finally {
    bitmap.close();
  }
  throw new Error('This photo could not be compressed enough. Choose a smaller image.');
};

const PhotoEvidenceInput = ({
  photos,
  onChange,
  required = false,
  validationError
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  required?: boolean;
  validationError?: string;
}) => {
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    input.value = '';
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`Attach no more than ${MAX_PHOTOS} photos.`);
      return;
    }

    setError('');
    setIsProcessing(true);
    try {
      const newPhotos = await Promise.all(files.map(compressPhoto));
      const nextPhotos = [...photos, ...newPhotos];
      if (nextPhotos.reduce((total, photo) => total + photo.length, 0) > MAX_TOTAL_PHOTO_DATA_URL_LENGTH) {
        throw new Error('The selected photos are too large to save. Remove a photo or choose smaller images.');
      }
      onChange(nextPhotos);
    } catch (photoError) {
      setError(photoError instanceof Error ? photoError.message : 'Could not process the selected photos.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="md:col-span-2 space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Project photos{required ? ' (required)' : ' (optional)'}
        <span className="block text-xs font-normal text-gray-500 mt-1">
          Attach up to {MAX_PHOTOS} photos. Images are compressed and saved only in this browser.
        </span>
        <span className="mt-2 flex items-center gap-2 rounded-lg border border-gray-300 p-3 text-green-800 hover:bg-green-50 cursor-pointer">
          <Camera className="w-5 h-5" />
          {isProcessing ? 'Processing photos…' : 'Choose or take photos'}
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={event => void handleFiles(event)}
            disabled={isProcessing || photos.length >= MAX_PHOTOS}
            className="sr-only"
          />
        </span>
      </label>
      {(error || validationError) && <p className="text-sm text-red-700" role="alert">{error || validationError}</p>}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {photos.map((photo, index) => (
            <div key={`${index}-${photo.slice(0, 32)}`} className="relative">
              <img src={photo} alt={`Project evidence ${index + 1}`} className="h-24 w-24 rounded-lg object-cover border border-gray-200" />
              <button
                type="button"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => onChange(photos.filter((_, photoIndex) => photoIndex !== index))}
                className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-red-700 shadow"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const GpsLocationCapture = ({
  coordinates,
  onChange,
  error
}: {
  coordinates: GeoCoordinates | null;
  onChange: (coordinates: GeoCoordinates) => void;
  error?: string;
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('This browser does not support GPS location.');
      return;
    }
    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      position => {
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLocating(false);
      },
      positionError => {
        const message = positionError.code === positionError.PERMISSION_DENIED
          ? 'Allow location access in your browser to capture GPS coordinates.'
          : positionError.code === positionError.TIMEOUT
            ? 'Location lookup timed out. Try again outdoors or with a better signal.'
            : 'Could not determine location. Check your device location settings and try again.';
        setLocationError(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const mapUrl = coordinates
    ? `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
    : '';

  return (
    <div className="md:col-span-2 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={captureLocation} loading={isLocating}>
          <MapPin className="w-4 h-4" /> Capture current GPS location
        </Button>
        {coordinates && (
          <a href={mapUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">
            {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)} — view on map
          </a>
        )}
      </div>
      <p className="text-xs text-gray-500">Capture this while at the project site. GPS supports review but does not by itself prove a project was launched.</p>
      {(locationError || error) && <p className="text-sm text-red-700" role="alert">{locationError || error}</p>}
    </div>
  );
};

const SubmissionConfirmation = ({
  title,
  referenceNumber,
  onSubmitAnother
}: {
  title: string;
  referenceNumber: string;
  onSubmitAnother: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <Card variant="elevated" padding="lg" className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">Your submission is in the oversight review queue. It will update the project tracker only after verification.</p>
        <div className="p-4 bg-gray-50 rounded-lg text-left mb-6">
          <p className="font-medium text-gray-900">Reference Number</p>
          <p className="text-2xl font-mono text-green-800 mt-1">{referenceNumber}</p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button variant="outline" onClick={() => navigate('/citizen/my-reports')}>View my submissions</Button>
          <Button onClick={onSubmitAnother}>Submit another</Button>
        </div>
      </Card>
    </div>
  );
};

export const SubmitLaunchedProjectPage = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { addReport } = useReports();
  const [submittedReference, setSubmittedReference] = useState('');
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    launchDate: '',
    sector: '',
    location: '',
    fundingType: 'Government' as FundingType,
    funder: '',
    contractor: '',
    valueKES: '',
    paidKES: '',
    status: 'On track' as ProjectStatus,
    note: '',
    sources: ''
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = 'Project name is required.';
    if (!formData.launchDate) nextErrors.launchDate = 'Launch date is required.';
    if (!formData.sector) nextErrors.sector = 'Sector is required.';
    if (!formData.location.trim()) nextErrors.location = 'Location is required.';
    if (!formData.funder.trim()) nextErrors.funder = 'Funder is required.';
    if (!formData.note.trim()) nextErrors.note = 'Describe the project launch.';
    if (!coordinates) nextErrors.coordinates = 'Capture the project site GPS location.';
    if (photos.length === 0) nextErrors.photos = 'Add at least one project-site photo.';

    const duplicate = projects.some(project => (
      project.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
      && project.location.trim().toLowerCase() === formData.location.trim().toLowerCase()
    ));
    if (duplicate) nextErrors.name = 'This project is already listed. Submit a project update instead.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const sources = parseSources(formData.sources);
    const projectSubmission: Omit<Project, 'id'> = {
      name: formData.name.trim(),
      launchDate: formData.launchDate,
      coordinates: coordinates || undefined,
      sector: formData.sector,
      location: formData.location.trim(),
      fundingType: formData.fundingType,
      funder: formData.funder.trim(),
      contractor: formData.contractor.trim() || null,
      valueKES: formData.valueKES ? Number(formData.valueKES) : null,
      paidKES: formData.paidKES ? Number(formData.paidKES) : null,
      status: formData.status,
      note: formData.note.trim(),
      sources
    };
    try {
      const report = addReport({
        type: 'project-launch',
        title: `Launched project: ${projectSubmission.name}`,
        projectName: projectSubmission.name,
        projectSubmission,
        description: projectSubmission.note,
        location: projectSubmission.location,
        county: user?.county || 'Tharaka-Nithi',
        photos,
        anonymous: false,
        submittedBy: user?.id || 'anonymous',
        coordinates: coordinates || undefined,
        evidence: sources
      });
      setSubmittedReference(report.referenceNumber);
      setSaveError('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save the project submission.');
    }
  };

  if (submittedReference) {
    return (
      <SubmissionConfirmation
        title="Project submitted for verification"
        referenceNumber={submittedReference}
        onSubmitAnother={() => {
          setSubmittedReference('');
          setSaveError('');
          setPhotos([]);
          setCoordinates(null);
          setErrors({});
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report a Launched Project</h1>
        <p className="text-gray-500">Submit a project that has started but is not yet in the tracker. Oversight will verify it before it becomes an official record.</p>
      </div>

      <Card variant="elevated" padding="lg">
        <CardContent>
          {saveError && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{saveError}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Project name" value={formData.name} onChange={event => setFormData({ ...formData, name: event.target.value })} error={errors.name} required />
            <Input label="Launch date" type="date" value={formData.launchDate} onChange={event => setFormData({ ...formData, launchDate: event.target.value })} error={errors.launchDate} required />
            <Select label="Sector" value={formData.sector} onChange={event => setFormData({ ...formData, sector: event.target.value })} error={errors.sector} placeholder="Select sector" options={SECTORS.map(sector => ({ value: sector, label: sector }))} />
            <Input label="Location" value={formData.location} onChange={event => setFormData({ ...formData, location: event.target.value })} error={errors.location} required />
            <GpsLocationCapture
              coordinates={coordinates}
              onChange={value => {
                setCoordinates(value);
                setErrors(previous => ({ ...previous, coordinates: '' }));
              }}
              error={errors.coordinates}
            />
            <Select label="Funding type" value={formData.fundingType} onChange={event => setFormData({ ...formData, fundingType: event.target.value as FundingType })} options={FUNDING_TYPES.map(type => ({ value: type, label: type }))} />
            <Input label="Funder" value={formData.funder} onChange={event => setFormData({ ...formData, funder: event.target.value })} error={errors.funder} required />
            <Input label="Contractor (optional)" value={formData.contractor} onChange={event => setFormData({ ...formData, contractor: event.target.value })} />
            <Input label="Contract value (KES, optional)" type="number" min="0" step="1" value={formData.valueKES} onChange={event => setFormData({ ...formData, valueKES: event.target.value })} />
            <Input label="Amount paid (KES, optional)" type="number" min="0" step="1" value={formData.paidKES} onChange={event => setFormData({ ...formData, paidKES: event.target.value })} />
            <Select label="Current status" value={formData.status} onChange={event => setFormData({ ...formData, status: event.target.value as ProjectStatus })} options={PROJECT_STATUSES.map(status => ({ value: status, label: status }))} />
            <div className="md:col-span-2">
              <Textarea label="Launch and progress details" value={formData.note} onChange={event => setFormData({ ...formData, note: event.target.value })} error={errors.note} rows={4} required />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Evidence or source links (one per line)" value={formData.sources} onChange={event => setFormData({ ...formData, sources: event.target.value })} rows={3} />
            </div>
            <PhotoEvidenceInput
              photos={photos}
              onChange={value => {
                setPhotos(value);
                setErrors(previous => ({ ...previous, photos: '' }));
              }}
              required
              validationError={errors.photos}
            />
            <div className="md:col-span-2 flex justify-end pt-4 border-t">
              <Button type="submit">Submit for verification</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export const SubmitProjectUpdatePage = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { addReport } = useReports();
  const [submittedReference, setSubmittedReference] = useState('');
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null);
  const [formData, setFormData] = useState({
    projectId: '',
    status: 'On track' as ProjectStatus,
    paidKES: '',
    description: '',
    evidence: ''
  });
  const selectedProject = projects.find(project => project.id === formData.projectId);

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(item => item.id === projectId);
    setFormData({
      ...formData,
      projectId,
      status: project?.status || 'On track',
      paidKES: project?.paidKES === null || project?.paidKES === undefined ? '' : String(project.paidKES)
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!selectedProject) nextErrors.projectId = 'Select a tracked project.';
    if (!formData.description.trim()) nextErrors.description = 'Describe the project progress you observed.';
    if (!coordinates) nextErrors.coordinates = 'Capture the project site GPS location.';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const evidence = parseSources(formData.evidence);
    try {
      const report = addReport({
        type: 'project-update',
        title: `Project update: ${selectedProject!.name}`,
        projectId: selectedProject!.id,
        projectName: selectedProject!.name,
        reportedStatus: formData.status,
        reportedPaidKES: formData.paidKES === '' ? undefined : Number(formData.paidKES),
        description: formData.description.trim(),
        location: selectedProject!.location,
        county: user?.county || 'Tharaka-Nithi',
        photos,
        anonymous: false,
        submittedBy: user?.id || 'anonymous',
        coordinates: coordinates || undefined,
        evidence
      });
      setSubmittedReference(report.referenceNumber);
      setSaveError('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save the project update.');
    }
  };

  if (submittedReference) {
    return (
      <SubmissionConfirmation
        title="Project update submitted"
        referenceNumber={submittedReference}
        onSubmitAnother={() => {
          setSubmittedReference('');
          setSaveError('');
          setPhotos([]);
          setCoordinates(null);
          setErrors({});
        }}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Project Progress</h1>
        <p className="text-gray-500">Submit an accountability update about a project in the tracker. Oversight will verify it before the official record changes.</p>
      </div>

      <Card variant="elevated" padding="lg">
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-gray-600">There are no tracked projects to report on yet.</p>
          ) : (
            <>
            {saveError && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{saveError}</p>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Select
                label="Tracked project"
                value={formData.projectId}
                onChange={event => handleProjectChange(event.target.value)}
                error={errors.projectId}
                options={[{ value: '', label: 'Select a project...' }, ...projects.map(project => ({ value: project.id, label: `${project.name} (${project.location})` }))]}
              />
              <GpsLocationCapture
                coordinates={coordinates}
                onChange={value => {
                  setCoordinates(value);
                  setErrors(previous => ({ ...previous, coordinates: '' }));
                }}
                error={errors.coordinates}
              />
              <Select
                label="Observed project status"
                value={formData.status}
                onChange={event => setFormData({ ...formData, status: event.target.value as ProjectStatus })}
                options={PROJECT_STATUSES.map(status => ({ value: status, label: status }))}
              />
              <Input
                label="Amount paid to date (KES, optional)"
                type="number"
                min="0"
                step="1"
                value={formData.paidKES}
                onChange={event => setFormData({ ...formData, paidKES: event.target.value })}
              />
              <Textarea
                label="Progress observed"
                value={formData.description}
                onChange={event => setFormData({ ...formData, description: event.target.value })}
                error={errors.description}
                placeholder="Describe the work completed, what you observed, and when."
                rows={5}
                required
              />
              <Textarea
                label="Evidence or source links (one per line)"
                value={formData.evidence}
                onChange={event => setFormData({ ...formData, evidence: event.target.value })}
                rows={3}
              />
              <PhotoEvidenceInput photos={photos} onChange={setPhotos} />
              {selectedProject && (
                <p className="text-sm text-gray-500">Location: {selectedProject.location}</p>
              )}
              <div className="flex justify-end pt-4 border-t">
                <Button type="submit">Submit update for verification</Button>
              </div>
            </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
