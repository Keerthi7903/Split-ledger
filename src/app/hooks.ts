/**
 * Typed Redux Hooks
 *
 * Standard Redux Toolkit pattern: typed wrappers for useDispatch and useSelector
 * ensuring full TypeScript inference across the application.
 */

import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
