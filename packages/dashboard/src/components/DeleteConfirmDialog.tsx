import { Dialog, DialogPanel, Title, Text } from '@tremor/react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isDeleting: boolean;
}

export function DeleteConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    isDeleting
}: DeleteConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={isDeleting ? () => {} : onClose} static={true}>
            <DialogPanel className="max-w-sm bg-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-50 rounded-full">
                        <AlertTriangle className="text-red-600" size={20} />
                    </div>
                    <Title className="text-gray-900">{title}</Title>
                </div>

                <Text className="mb-6 text-gray-600">
                    {message}
                </Text>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </DialogPanel>
        </Dialog>
    );
}
