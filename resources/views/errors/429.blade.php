@php
    $page = 'error';
    $status = 429;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="429" />
@endsection
