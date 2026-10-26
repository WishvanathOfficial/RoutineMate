import { useEffect } from 'react';
import { selectIsAuthenticated } from '@features/auth/auth.selectors';
import { fetchProfileThunk } from '@features/profile/profile.thunks';
import { selectPreferences, selectProfileStatus } from '@features/profile/profile.selectors';
import { useAppDispatch, useAppSelector } from './hooks';

export default function LocaleSync() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const profileStatus = useAppSelector(selectProfileStatus);
  const locale = useAppSelector(selectPreferences).language;

  useEffect(() => {
    if (isAuthenticated && profileStatus === 'idle') {
      dispatch(fetchProfileThunk());
    }
  }, [dispatch, isAuthenticated, profileStatus]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
