import pyaudio
from ..lib.respeaker_tuning import find, get_index
import numpy as np
from ..lib.audio_system import AudioSystem
from ..lib.loggable import Loggable

class Microphone(Loggable):
    """
    class for audiostreams

    Attributes:
        stream : pyaudio stream
    """
    SAMPLE_RATE = 16000
    PA_FORMAT = pyaudio.paInt16
    CHUNK_SIZE = 1600

    # respeaker setting
    RESPEAKER_CHANNELS = 6
    RESPEAKER_CHUNK = 1024

    def __init__(self):
        Loggable.__init__(self)
        self.set_tag("microphone")

        self.pa = pyaudio.PyAudio()
        self.respeaker_tuning = find()
        self.stream = None
        self.respeaker_index = AudioSystem().get_respeaker_index()

    def __enter__(self) -> "Microphone":
        self.open()
        return self
    
    def __exit__(self, type, value, traceback):
        self.close()

    def is_active(self) -> bool:
        return self.stream is not None and self.stream.is_active()

    def close(self) -> None:
        if self.stream:
            if hasattr(self, 'respeaker_index') and self.respeaker_index is not None:
                self.log(f"🎤 ReSpeaker INPUT released from index {self.respeaker_index}")
            else:
                self.log("🎤 Default microphone released")
            self.stream.close()
            self.stream = None

    def open(self) -> None:
        """
        output_device_index selects the speaker index.
        """
        if self.stream:
            self.close()

        if self.respeaker_tuning and self.respeaker_index is not None:
            self.stream = self.pa.open(  channels=self.RESPEAKER_CHANNELS,
                                    format=self.PA_FORMAT,
                                    rate=self.SAMPLE_RATE, 
                                    frames_per_buffer=self.RESPEAKER_CHUNK,
                                    input=True,
                                    input_device_index=self.respeaker_index,
                                    output = False
                                )
            self.log(f"🎤 ReSpeaker INPUT accessed at index {self.respeaker_index}")
            
        else:
            self.stream = self.pa.open(  channels=1,
                                    format=self.PA_FORMAT,
                                    rate=self.SAMPLE_RATE, 
                                    frames_per_buffer=self.CHUNK_SIZE,
                                    input=True,
                                    output = False
                                )
            self.log("🎤 Using system default microphone")
            
    
    def read(self, num_frames: int):
        """
        Read audio data from the stream.
        """
        data = self.stream.read(num_frames, exception_on_overflow=False)
        
        if self.respeaker_tuning:
            audio_data = np.frombuffer(data, dtype=np.int16)
            channel_0_data = audio_data[0::self.RESPEAKER_CHANNELS]     # channel 0 is the echo cancelled input
            return channel_0_data.tobytes()
        else:
            return data