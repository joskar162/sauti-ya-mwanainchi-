import { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Heart, 
  BookOpen, 
  Truck,
  Plus,
  Search,
  Filter,
  DollarSign,
  Mail,
  Phone
} from 'lucide-react';
import { useCommunityNeeds } from '@/context/CommunityNeedsContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { NEED_CATEGORIES, formatDate } from '@/utils/constants';
import type { CommunityNeed, NeedCategory } from '@/types';

const categoryIcons: Record<NeedCategory, React.ReactNode> = {
  Water: <MapPin className="w-4 h-4" />,
  Health: <Heart className="w-4 h-4" />,
  Education: <BookOpen className="w-4 h-4" />,
  Transport: <Truck className="w-4 h-4" />,
  Other: <Users className="w-4 h-4" />
};

export const CommunityNeedsPage = () => {
  const { needs, addNeed, expressInterest } = useCommunityNeeds();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<NeedCategory | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddNeedModal, setShowAddNeedModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState<{ need: CommunityNeed | null; open: boolean }>({ need: null, open: false });

  const filteredNeeds = needs.filter(need => {
    const matchesSearch = !search || 
      need.title.toLowerCase().includes(search.toLowerCase()) ||
      need.description.toLowerCase().includes(search.toLowerCase()) ||
      need.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || need.category === categoryFilter;
    const matchesLocation = locationFilter === 'all' || need.location === locationFilter;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const uniqueLocations = [...new Set(needs.map(n => n.location))].sort();

  const handleExpressInterest = (need: CommunityNeed) => {
    if (user?.role !== 'oversight') {
      alert('Only oversight users and funders can express interest.');
      return;
    }
    setShowInterestModal({ need, open: true });
  };

  const handleConfirmInterest = () => {
    if (showInterestModal.need) {
      expressInterest(showInterestModal.need.id, user?.name || 'Oversight Officer');
      setShowInterestModal({ need: null, open: false });
      alert('Interest expressed! The community need coordinator will contact you.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Needs</h1>
          <p className="text-gray-500">{filteredNeeds.length} needs identified — Tharaka-Nithi County</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-1" /> Filters
          </Button>
          {user?.role === 'oversight' && (
            <Button onClick={() => setShowAddNeedModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Need
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card variant="outlined" className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Input
                label="Search"
                placeholder="Title, description, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="lg:col-span-2"
              />
              <Select
                label="Category"
                options={[{value: 'all', label: 'All Categories'}, ...NEED_CATEGORIES.map(c => ({value: c, label: c}))]}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as NeedCategory | 'all')}
              />
              <Select
                label="Location"
                options={[{value: 'all', label: 'All Locations'}, ...uniqueLocations.map(l => ({value: l, label: l}))]}
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNeeds.map(need => (
          <CommunityNeedCard 
            key={need.id} 
            need={need} 
            isOversight={user?.role === 'oversight'}
            onExpressInterest={handleExpressInterest}
          />
        ))}
        {filteredNeeds.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No community needs match your filters.</p>
          </div>
        )}
      </div>

      <AddNeedModal 
        isOpen={showAddNeedModal} 
        onClose={() => setShowAddNeedModal(false)}
        onAdd={addNeed}
      />

      <InterestModal 
        need={showInterestModal.need} 
        isOpen={showInterestModal.open} 
        onClose={() => setShowInterestModal({ need: null, open: false })}
        onConfirm={handleConfirmInterest}
        userName={user?.name || 'Oversight Officer'}
      />
    </div>
  );
};

const CommunityNeedCard = ({ need, isOversight, onExpressInterest }: { 
  need: CommunityNeed; 
  isOversight: boolean;
  onExpressInterest: (need: CommunityNeed) => void;
}) => {
  return (
    <Card variant="outlined" className="h-full flex flex-col">
      <CardContent className="p-5 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              {categoryIcons[need.category]}
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">{need.title}</h3>
          </div>
          <StatusPill status={need.category} type="funding" size="sm" />
        </div>

        <div className="space-y-3 text-sm flex-1">
          <p className="text-gray-600">{need.description}</p>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{need.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Support needed: {need.supportNeeded}</span>
          </div>
          {need.sources && need.sources.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Sources:</p>
              <ul className="space-y-1 text-xs text-gray-500">
                {need.sources.map((source, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{source}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          {isOversight && (
            <Button variant="outline" className="w-full" onClick={() => onExpressInterest(need)}>
              <Heart className="w-4 h-4 mr-1" /> Funders: Express Interest
            </Button>
          )}
          {!isOversight && (
            <p className="text-sm text-gray-500 text-center">
              Funders and oversight bodies can express interest in supporting this need.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AddNeedModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (need: Omit<CommunityNeed, 'id' | 'submittedAt' | 'status'>) => void }) => {
  const [formData, setFormData] = useState({
    title: '', category: 'Water' as NeedCategory, location: '', 
    supportNeeded: '', description: '', sources: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.supportNeeded) newErrors.supportNeeded = 'Support needed is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onAdd({
      title: formData.title,
      category: formData.category,
      location: formData.location,
      supportNeeded: formData.supportNeeded,
      description: formData.description,
      sources: formData.sources.split('\n').filter(s => s.trim())
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report a Community Need" size="lg" description="Help identify infrastructure gaps in your community">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} error={errors.title} placeholder="e.g., Kamwathu Village Borehole" />
        <Select label="Category" options={NEED_CATEGORIES.map(c => ({value: c, label: c}))} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as NeedCategory})} error={errors.category} placeholder="Select category" />
        <Input label="Location (Village, Ward)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} error={errors.location} placeholder="e.g., Kamwathu, Tharaka South" />
        <Input label="Support Needed" value={formData.supportNeeded} onChange={e => setFormData({...formData, supportNeeded: e.target.value})} error={errors.supportNeeded} placeholder="e.g., Drilling and equipping of borehole with solar pump" />
        <Textarea label="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} error={errors.description} placeholder="Describe the need, population affected, current situation..." rows={4} />
        <Textarea label="Sources (optional, one per line)" value={formData.sources} onChange={e => setFormData({...formData, sources: e.target.value})} placeholder="Chief's report, Ward meeting minutes, etc." rows={2} />
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Submit Need</Button>
        </div>
      </form>
    </Modal>
  );
};

const InterestModal = ({ need, isOpen, onClose, onConfirm, userName }: { 
  need: CommunityNeed | null; 
  isOpen: boolean; 
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}) => {
  if (!need) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Express Interest" size="md" description={`Confirm your interest in supporting: ${need.title}`}>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">{need.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{need.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <StatusPill status={need.category} type="funding" size="sm" />
            <span>{need.location}</span>
          </div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>{userName}</strong> will be recorded as expressing interest.
            The community need coordinator will contact you to discuss next steps.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm Interest</Button>
        </div>
      </div>
    </Modal>
  );
};