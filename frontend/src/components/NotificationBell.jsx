import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/api';
import { socket, connectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // 1. Connect socket room & fetch initial notifications on mount
  useEffect(() => {
    if (!user) return;

    // Connect to Socket.IO and join personal room
    connectSocket(user._id);

    const fetchNotifications = async () => {
      try {
        const [feedRes, countRes] = await Promise.all([
          getMyNotifications(),
          getUnreadNotificationCount(),
        ]);
        setNotifications(feedRes.data.data || []);
        setUnreadCount(countRes.data.unreadCount || 0);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();

    // 2. Setup Socket.IO real-time event listener
    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [user]);

  // 3. Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Mark single notification as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === id ? { ...notif, read: true } : notif))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // 5. Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking_request': return 'text-blue-600 bg-blue-50';
      case 'booking_accepted': return 'text-emerald-600 bg-emerald-50';
      case 'booking_rejected': return 'text-red-600 bg-red-50';
      case 'ride_cancelled': return 'text-amber-600 bg-amber-50';
      case 'ride_reminder': return 'text-purple-600 bg-purple-50';
      case 'report_update': return 'text-rose-600 bg-rose-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const formatTypeLabel = (type) => {
    switch (type) {
      case 'booking_request': return 'New Booking';
      case 'booking_accepted': return 'Booking Confirmed';
      case 'booking_rejected': return 'Booking Declined';
      case 'ride_cancelled': return 'Ride / Seat Cancelled';
      case 'ride_reminder': return 'Trip Reminder';
      case 'report_update': return 'Safety Report Update';
      default: return 'Notification';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full transition-colors cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white leading-none transform translate-x-1 -translate-y-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <span className="font-semibold text-xs uppercase tracking-wider text-slate-700">
              Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-3.5 hover:bg-slate-50/80 transition-colors flex gap-3 ${
                    !notif.read ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <div className={`mt-0.5 p-2 rounded-lg h-fit shrink-0 ${getNotificationColor(notif.type)}`}>
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-800">
                        {formatTypeLabel(notif.type)}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif._id, e)}
                      className="shrink-0 p-1 text-slate-400 hover:text-emerald-600 rounded transition cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;