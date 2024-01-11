function notifyDataChanged(dataIndex: number): void {
    // Log.debug(TAG, `notifyDataChanged,loadingListeners size:${this.loadingListeners.length},index:${dataIndex}`);
    for (let listener of this.loadingListeners) {
        listener.onDataChanged(dataIndex);
    }
}