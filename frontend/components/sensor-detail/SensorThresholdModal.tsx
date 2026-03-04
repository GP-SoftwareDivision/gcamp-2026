import { Button, Input } from '@/components/ui'
import type { SensorThresholdModalProps } from '@/types/pages'
import { X } from 'lucide-react-native'
import { Modal, Pressable, Text, View } from 'react-native'

export function SensorThresholdModal({
  visible,
  isDark,
  isConfirmStepVisible,
  isSaving,
  sensorInfo,
  sensorUnit,
  thresholdDraft,
  thresholdErrorMessage,
  thresholdKeyboardType,
  currentThresholdLabel,
  appliedThreshold,
  confirmActionType,
  confirmActionTitle,
  confirmActionMessage,
  confirmActionButtonLabel,
  confirmMinValueLabel,
  confirmMaxValueLabel,
  editActionButtonLabel,
  isEditActionDisabled,
  onClose,
  onCancelConfirmStep,
  onConfirmSaveThreshold,
  onRequestSaveThreshold,
  onRequestResetThreshold,
  onChangeMinInput,
  onChangeMaxInput,
}: SensorThresholdModalProps) {
  const modalTitle = isConfirmStepVisible ? confirmActionTitle : `${sensorInfo.label} 임계치 설정`

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View className='flex-1 items-center justify-center bg-black/45 px-4'>
        <View className='w-full rounded-3xl border border-border bg-card px-5 pb-5 pt-4 dark:border-border-dark dark:bg-card-dark'>
          <View className='flex-row items-start justify-between gap-3'>
            <Text className='flex-1 font-semibold text-title-2 text-content dark:text-content-dark'>
              {modalTitle}
            </Text>
            <Pressable
              onPress={onClose}
              className='h-8 w-8 items-center justify-center rounded-full border border-border bg-card dark:border-border-dark dark:bg-card-dark'
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={isSaving}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <X size={16} color={isDark ? '#E0E0E0' : '#1C1C1E'} strokeWidth={2} />
            </Pressable>
          </View>

          {isConfirmStepVisible ? (
            <>
              <Text className='mt-1 text-subhead text-content-secondary dark:text-content-dark-secondary'>
                {confirmActionMessage}
              </Text>

              <View className='mt-4 border-t border-border pt-3 dark:border-border-dark'>
                <View className='flex-row items-center justify-between py-1'>
                  <Text className='text-subhead text-content-secondary dark:text-content-dark-secondary'>
                    최소값
                  </Text>
                  <Text className='font-medium text-subhead text-content dark:text-content-dark'>
                    {confirmMinValueLabel}
                  </Text>
                </View>
                <View className='flex-row items-center justify-between py-1'>
                  <Text className='text-subhead text-content-secondary dark:text-content-dark-secondary'>
                    최대값
                  </Text>
                  <Text className='font-medium text-subhead text-content dark:text-content-dark'>
                    {confirmMaxValueLabel}
                  </Text>
                </View>
              </View>

              {thresholdErrorMessage ? (
                <Text className='mt-3 text-footnote text-danger'>{thresholdErrorMessage}</Text>
              ) : null}

              <View className='mt-4 flex-row gap-2'>
                <Button
                  title='취소'
                  variant='secondary'
                  size='md'
                  className='flex-1 rounded-2xl'
                  onPress={onCancelConfirmStep}
                  disabled={isSaving}
                />
                <Button
                  title={confirmActionButtonLabel}
                  size='md'
                  className='flex-1 rounded-2xl'
                  onPress={onConfirmSaveThreshold}
                  loading={isSaving}
                  disabled={isSaving}
                  variant={confirmActionType === 'reset' ? 'danger' : 'primary'}
                />
              </View>
            </>
          ) : (
            <>
              <Text className='mt-1 text-subhead text-content-secondary dark:text-content-dark-secondary'>
                현재 설정: {currentThresholdLabel}
              </Text>

              <View className='mt-4 flex-row gap-2'>
                <Input
                  label={`최소값 (${sensorUnit})`}
                  className='flex-1'
                  value={thresholdDraft.minInput}
                  onChangeText={onChangeMinInput}
                  keyboardType={thresholdKeyboardType}
                  placeholder='최소값 입력'
                  textAlign='right'
                  maxLength={10}
                />
                <Input
                  label={`최대값 (${sensorUnit})`}
                  className='flex-1'
                  value={thresholdDraft.maxInput}
                  onChangeText={onChangeMaxInput}
                  keyboardType={thresholdKeyboardType}
                  placeholder='최대값 입력'
                  textAlign='right'
                  maxLength={10}
                />
              </View>

              {thresholdErrorMessage ? (
                <Text className='mt-3 text-footnote text-danger'>{thresholdErrorMessage}</Text>
              ) : null}

              <View className='mt-4 flex-row gap-2'>
                <Button
                  title='취소'
                  variant='secondary'
                  size='md'
                  className='flex-1 rounded-2xl'
                  onPress={onClose}
                  disabled={isSaving}
                />
                <Button
                  title={editActionButtonLabel}
                  size='md'
                  className='flex-1 rounded-2xl'
                  onPress={onRequestSaveThreshold}
                  disabled={isEditActionDisabled}
                  variant='primary'
                />
              </View>

              {appliedThreshold ? (
                <Pressable
                  className='mt-2 h-12 items-center justify-center rounded-2xl border border-danger/30 bg-danger/5 active:opacity-70'
                  onPress={onRequestResetThreshold}
                  disabled={isSaving}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text
                    className={`font-semibold text-headline ${
                      isSaving ? 'text-content-tertiary dark:text-content-dark-secondary' : 'text-danger'
                    }`}
                  >
                    초기화
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}
