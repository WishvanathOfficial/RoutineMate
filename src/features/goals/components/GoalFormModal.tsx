import Modal from '@components/Modal/Modal';
import GoalForm from './GoalForm';
import type { CreateGoalInput } from '../goals.types';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateGoalInput) => void;
}

export default function GoalFormModal({ isOpen, onClose, onSubmit }: GoalFormModalProps) {
  return (
    <Modal isOpen={isOpen} title="Create New Goal" onClose={onClose}>
      <GoalForm onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
}
