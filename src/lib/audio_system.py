from ..lib.loggable import Loggable
from ..lib.singleton import Singleton
from ..lib.respeaker_tuning import get_index
import pyaudio

class AudioSystem(Singleton, Loggable):
    """중앙 집중식 오디오 시스템 관리"""
    
    def _init(self):
        Loggable.__init__(self)
        self.set_tag("audio_system")
        
        self._pa_instance = None
        self._respeaker_index = None
        self._device_info_cached = False
        self._respeaker_available = False
        
    def initialize(self):
        if not self._device_info_cached:
            try:
                self.log("🔧 AudioSystem: PyAudio instance creating...")
                temp_pa = pyaudio.PyAudio()
                try:
                    self._respeaker_index = get_index(
                        temp_pa.get_host_api_info_by_index(0).get('deviceCount')
                    )
                finally:
                    temp_pa.terminate()  # 즉시 해제
                
                if self._respeaker_index is not None:
                    self._respeaker_available = True
                    self.log(f"✅ ReSpeaker initialized at index {self._respeaker_index}")
                else:
                    self._respeaker_available = False
                    self.log("⚠️ ReSpeaker not found - using system default audio")
                    
                self._device_info_cached = True
                
            except Exception as e:
                self.log(f"❌ Audio system initialization failed: {e}")
                self._respeaker_available = False
    
    def is_respeaker_available(self):
        return self._respeaker_available
    
    # def get_pa_instance(self):
    #     return self._pa_instance
    
    def get_respeaker_index(self):
        return self._respeaker_index
    
    def get_audio_status(self):
        return {
            'respeaker_available': self._respeaker_available,
            'respeaker_index': self._respeaker_index,
            'fallback_mode': not self._respeaker_available
        }
    
    def terminate(self):
        if self._pa_instance:
            if self._respeaker_available:
                self.log(f"🔧 AudioSystem: ReSpeaker SYSTEM terminated from index {self._respeaker_index}")
            else:
                self.log("🔧 AudioSystem: Default audio system terminated")
            self._pa_instance.terminate()
            self._pa_instance = None
            self._device_info_cached = False

        self.log("🔧 Audio system terminated")
